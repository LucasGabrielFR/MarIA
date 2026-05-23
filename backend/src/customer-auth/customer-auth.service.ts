import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { StripeService } from '../stripe/stripe.service';
import { AsaasService } from '../asaas/asaas.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);
  private readonly frontendUrl: string;

  constructor(
    private supabaseService: SupabaseService,
    private uazapiService: UazapiService,
    private stripeService: StripeService,
    private asaasService: AsaasService,
    private configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://maria.acutistech.com.br';
  }

  // --- HELPER METHODS ---

  private sanitizePhone(phone: string): string {
    let sanitized = phone.replace(/\D/g, '');
    // If length is 10 or 11 (Brazilian phone without country code), prepend '55'
    if (sanitized.length === 10 || sanitized.length === 11) {
      sanitized = '55' + sanitized;
    }

    // Normalize prefix 9
    if (sanitized.startsWith('55') && sanitized.length >= 4) {
      const ddi = '55';
      const ddd = sanitized.slice(2, 4);
      const number = sanitized.slice(4);
      if (number.length === 8) {
        sanitized = ddi + ddd + '9' + number;
      }
    }

    return sanitized;
  }

  async validateSession(
    sessionToken: string,
  ): Promise<{ userId: string; phone: string }> {
    const { data: session, error } = await this.supabaseService
      .getClient()
      .from('magic_links')
      .select('*')
      .eq('token', sessionToken)
      .single();

    if (error || !session) {
      throw new ForbiddenException(
        'Sessão inválida ou não encontrada. Faça login novamente.',
      );
    }

    if (session.used) {
      throw new ForbiddenException(
        'Esta sessão foi revogada. Faça login novamente.',
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new ForbiddenException('Sessão expirada. Faça login novamente.');
    }

    // Fetch user to confirm existence and active association by user_id
    const { data: user, error: userError } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, phone')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      throw new ForbiddenException(
        'Usuário associado a esta sessão não foi encontrado.',
      );
    }

    return { userId: user.id, phone: user.phone };
  }

  async getCustomerPortalDataByPhone(phone: string) {
    const sanitizedPhone = this.sanitizePhone(phone);

    // resilient search via find_user_by_normalized_phone RPC
    const { data: user, error: userError } = (await this.supabaseService
      .getClient()
      .rpc('find_user_by_normalized_phone', { phone_query: sanitizedPhone })
      .maybeSingle()) as any;

    if (userError || !user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Fetch all transaction/billing history from subscriptions table
    const { data: invoices, error: invError } = await this.supabaseService
      .getClient()
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (invError) {
      this.logger.error(
        `Error fetching subscriptions for user ${user.id}: ${invError.message}`,
      );
    }

    return {
      user: {
        id: user.id,
        name: user.name || 'Assinante MarIA',
        phone: user.phone,
        subscription_tier: user.subscription_tier || 'free',
        subscription_expires_at: user.subscription_expires_at,
        asaas_subscription_id: user.asaas_subscription_id,
      },
      invoices: invoices || [],
    };
  }

  // --- NEW CUSTOMER PORTAL SERVICE METHODS ---

  async requestVerificationCode(phone: string) {
    const sanitizedPhone = this.sanitizePhone(phone);

    // 1. Check if user exists using resilient RPC lookup
    const { data: user, error: userError } = (await this.supabaseService
      .getClient()
      .rpc('find_user_by_normalized_phone', { phone_query: sanitizedPhone })
      .maybeSingle()) as any;

    if (userError || !user) {
      throw new NotFoundException(
        'Número de telefone não cadastrado em nossa base de assinantes.',
      );
    }

    // 2. Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code is valid for 15 minutes

    // 3. Save code to magic_links table using user_id column
    const { error: insertError } = await this.supabaseService
      .getClient()
      .from('magic_links')
      .insert({
        user_id: user.id,
        token: code,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      this.logger.error(
        `Error saving verification code: ${insertError.message}`,
      );
      throw new Error('Falha ao gerar o código de verificação.');
    }

    // 4. Send via WhatsApp
    const message = `Olá! Recebemos uma solicitação para acessar a sua área de assinante MarIA. 🕊️\n\nSeu código de verificação é:\n\n*${code}*\n\nInsira este código na tela de login para gerenciar sua assinatura. Este código expira em 15 minutos.\n\nSe você não solicitou este acesso, apenas ignore esta mensagem.`;

    const sent = await this.uazapiService.sendMessage(user.phone, message);

    if (!sent) {
      throw new Error(
        'Falha ao enviar o código pelo WhatsApp. Tente novamente mais tarde.',
      );
    }

    return {
      message: 'Código de verificação enviado com sucesso para seu WhatsApp.',
    };
  }

  async verifyCodeAndGetPortalData(phone: string, code: string) {
    const sanitizedPhone = this.sanitizePhone(phone);

    // Find user first
    const { data: user, error: userError } = (await this.supabaseService
      .getClient()
      .rpc('find_user_by_normalized_phone', { phone_query: sanitizedPhone })
      .maybeSingle()) as any;

    if (userError || !user) {
      throw new NotFoundException(
        'Número de telefone não cadastrado em nossa base de assinantes.',
      );
    }

    // 1. Fetch active unused code record by user_id
    const { data: records, error } = await this.supabaseService
      .getClient()
      .from('magic_links')
      .select('*')
      .eq('user_id', user.id)
      .eq('token', code)
      .order('created_at', { ascending: false })
      .limit(1);

    const record = records?.[0];

    if (error || !record) {
      throw new BadRequestException('Código de verificação inválido.');
    }

    if (record.used) {
      throw new BadRequestException(
        'Este código já foi utilizado. Solicite um novo.',
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new BadRequestException('Este código expirou. Solicite um novo.');
    }

    // 2. Mark code as used
    await this.supabaseService
      .getClient()
      .from('magic_links')
      .update({ used: true })
      .eq('id', record.id);

    // 3. Generate a secure random 32-byte hexadecimal session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 1); // Session valid for 1 hour

    // 4. Save session token to magic_links table under user_id
    const { error: sessionError } = await this.supabaseService
      .getClient()
      .from('magic_links')
      .insert({
        user_id: user.id,
        token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        used: false,
      });

    if (sessionError) {
      this.logger.error(
        `Error saving customer session: ${sessionError.message}`,
      );
      throw new Error('Falha ao iniciar sessão segura.');
    }

    // 5. Return portal billing data along with the session token
    const portalData = await this.getCustomerPortalDataByPhone(user.phone);

    return {
      sessionToken,
      ...portalData,
    };
  }

  async getCustomerPortalData(sessionToken: string) {
    const { phone } = await this.validateSession(sessionToken);
    return this.getCustomerPortalDataByPhone(phone);
  }

  async cancelSubscription(sessionToken: string) {
    const { userId } = await this.validateSession(sessionToken);

    // 1. Fetch user to obtain their asaas_subscription_id
    const { data: user, error: userError } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, phone, asaas_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new BadRequestException('Assinante não encontrado.');
    }

    // 2. If subscription is active in Asaas, cancel it
    if (user.asaas_subscription_id) {
      try {
        await this.asaasService.cancelSubscription(user.asaas_subscription_id);
      } catch (err) {
        this.logger.error(
          `Failed to cancel subscription ${user.asaas_subscription_id} in Asaas: ${err.message}`,
        );
        // Continue to downgrade local database state even if Asaas cancellation fails (to ensure robust recovery)
      }
    }

    // 3. Keep current active paid subscriptions in the database as 'paid' because the period is already paid for!
    // Instead, we only update the user's local record to set asaas_subscription_id to null (stopping future recurrence management),
    // but preserving subscription_tier, plan_tier, and subscription_expires_at so they keep their active access until the period naturally expires.
    const { data: updatedUser, error: updateError } = await this.supabaseService
      .getClient()
      .from('users')
      .update({
        asaas_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, name, phone, subscription_tier, subscription_expires_at')
      .single();

    if (updateError) {
      this.logger.error(
        `Error updating user status upon cancellation: ${updateError.message}`,
      );
      throw new Error('Falha ao atualizar cadastro do assinante.');
    }

    const portalData = await this.getCustomerPortalDataByPhone(updatedUser.phone);

    return {
      success: true,
      message: 'Assinatura cancelada com sucesso. Seu acesso continuará ativo até a data de expiração.',
      ...portalData,
    };
  }

  async changePlan(sessionToken: string, planId: string, cycle: string) {
    const { userId } = await this.validateSession(sessionToken);

    // 1. Fetch user & subscription info
    const supabase = this.supabaseService.getClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, subscriptions(*)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new BadRequestException('Assinante não encontrado.');
    }

    if (!user.asaas_subscription_id) {
      throw new BadRequestException(
        'Não foi possível identificar uma assinatura ativa no Asaas para alteração.',
      );
    }

    // 2. Map and determine new billing value andcycle
    let value = 0;
    let cycleAsaas = 'MONTHLY';
    let description = '';

    const tier = planId.toLowerCase();
    const normalizedCycle = cycle.toLowerCase();

    if (tier === 'basic') {
      if (normalizedCycle === 'annual') {
        value = 154.8;
        cycleAsaas = 'YEARLY';
        description = 'Plano Básico (Anual) - Atualizado';
      } else {
        value = 14.99;
        cycleAsaas = 'MONTHLY';
        description = 'Plano Básico (Mensal) - Atualizado';
      }
    } else if (tier === 'premium') {
      if (normalizedCycle === 'annual') {
        value = 322.8;
        cycleAsaas = 'YEARLY';
        description = 'Plano Premium (Anual) - Atualizado';
      } else {
        value = 29.9;
        cycleAsaas = 'MONTHLY';
        description = 'Plano Premium (Mensal) - Atualizado';
      }
    } else {
      throw new BadRequestException('Plano selecionado inválido.');
    }

    // 3. Update active subscription in Asaas
    try {
      await this.asaasService.updateSubscription(user.asaas_subscription_id, {
        value,
        cycle: cycleAsaas,
        description,
      });
    } catch (err) {
      this.logger.error(
        `Failed to update subscription ${user.asaas_subscription_id} in Asaas: ${err.message}`,
      );
      throw new Error(`Falha ao atualizar assinatura no Asaas: ${err.message}`);
    }

    // 4. Calculate new expiration date
    const expiresAt = new Date();
    if (normalizedCycle === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 5. Sync updates to local database (users and subscriptions tables)
    await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        plan_tier: tier,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Reset message count upon plan change (upgrade/downgrade)
    await supabase
      .from('messages')
      .update({ is_llm: false })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .eq('is_llm', true);

    // Update active 'paid' subscription record in our database
    const activeSub = user.subscriptions?.find((s: any) => s.status === 'paid');
    if (activeSub) {
      await supabase
        .from('subscriptions')
        .update({
          tier: tier,
          amount: value,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeSub.id);
    } else {
      // If no local record exists, insert a new one
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        tier,
        amount: value,
        status: 'paid',
        provider: 'asaas',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Return newly updated customer portal billing state
    return this.getCustomerPortalDataByPhone(user.phone);
  }

  // --- LEGACY MAGIC LINK SERVICE METHODS (Preserved) ---

  async requestMagicLink(phone: string) {
    // 1. Check if user exists
    const { data: user, error: userError } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, stripe_customer_id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      throw new NotFoundException(
        'Número de telefone não encontrado em nossa base de assinantes.',
      );
    }

    if (!user.stripe_customer_id) {
      throw new BadRequestException(
        'Usuário encontrado, mas não possui uma assinatura registrada (Stripe).',
      );
    }

    // 2. Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

    // 3. Save to database
    const { error: insertError } = await this.supabaseService
      .getClient()
      .from('magic_links')
      .insert({
        user_id: user.id, // Use correct schema
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      this.logger.error(`Error saving magic link: ${insertError.message}`);
      throw new Error('Falha ao gerar o link de acesso.');
    }

    // 4. Send via WhatsApp
    const magicLinkUrl = `${this.frontendUrl}/verify?token=${token}`;
    const message = `Olá! Recebemos uma solicitação para acessar a sua área de assinante MarIA.\n\nPara gerenciar sua assinatura, clique no link seguro abaixo. Este link expira em 15 minutes:\n\n${magicLinkUrl}\n\nSe você não solicitou este acesso, apenas ignore esta mensagem.`;

    const sent = await this.uazapiService.sendMessage(phone, message);

    if (!sent) {
      throw new Error('Falha ao enviar o link de acesso pelo WhatsApp.');
    }

    return {
      message: 'Link de acesso enviado com sucesso para o seu WhatsApp.',
    };
  }

  async verifyMagicLinkAndGetPortal(token: string) {
    // 1. Verify token in database
    const { data: magicLink, error } = await this.supabaseService
      .getClient()
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !magicLink) {
      throw new BadRequestException('Link inválido ou não encontrado.');
    }

    if (magicLink.used) {
      throw new BadRequestException(
        'Este link já foi utilizado. Solicite um novo acesso.',
      );
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      throw new BadRequestException(
        'Este link expirou. Solicite um novo acesso.',
      );
    }

    // 2. Mark as used
    await this.supabaseService
      .getClient()
      .from('magic_links')
      .update({ used: true })
      .eq('id', magicLink.id);

    // 3. Fetch user by id instead of phone
    const { data: user, error: userError } = await this.supabaseService
      .getClient()
      .from('users')
      .select('id, stripe_customer_id')
      .eq('id', magicLink.user_id)
      .single();

    if (userError || !user || !user.stripe_customer_id) {
      throw new BadRequestException(
        'Não foi possível encontrar a assinatura atrelada a este número.',
      );
    }

    // 4. Generate Stripe Portal URL
    return this.stripeService.createCustomerPortalSession(user.id);
  }
}
