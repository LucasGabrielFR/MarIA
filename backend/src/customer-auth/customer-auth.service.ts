import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { StripeService } from '../stripe/stripe.service';
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
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://maria.acutistech.com.br';
  }

  async requestMagicLink(phone: string) {
    // 1. Check if user exists
    const { data: user, error: userError } = await this.supabaseService.getClient()
      .from('users')
      .select('id, stripe_customer_id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      throw new NotFoundException('Número de telefone não encontrado em nossa base de assinantes.');
    }

    if (!user.stripe_customer_id) {
      throw new BadRequestException('Usuário encontrado, mas não possui uma assinatura registrada (Stripe).');
    }

    // 2. Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

    // 3. Save to database
    const { error: insertError } = await this.supabaseService.getClient()
      .from('magic_links')
      .insert({
        phone: phone,
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
    const message = `Olá! Recebemos uma solicitação para acessar a sua área de assinante MarIA.\n\nPara gerenciar sua assinatura, clique no link seguro abaixo. Este link expira em 15 minutos:\n\n${magicLinkUrl}\n\nSe você não solicitou este acesso, apenas ignore esta mensagem.`;

    const sent = await this.uazapiService.sendMessage(phone, message);

    if (!sent) {
      throw new Error('Falha ao enviar o link de acesso pelo WhatsApp.');
    }

    return { message: 'Link de acesso enviado com sucesso para o seu WhatsApp.' };
  }

  async verifyMagicLinkAndGetPortal(token: string) {
    // 1. Verify token in database
    const { data: magicLink, error } = await this.supabaseService.getClient()
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !magicLink) {
      throw new BadRequestException('Link inválido ou não encontrado.');
    }

    if (magicLink.used) {
      throw new BadRequestException('Este link já foi utilizado. Solicite um novo acesso.');
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      throw new BadRequestException('Este link expirou. Solicite um novo acesso.');
    }

    // 2. Mark as used
    await this.supabaseService.getClient()
      .from('magic_links')
      .update({ used: true })
      .eq('id', magicLink.id);

    // 3. Fetch user by phone
    const { data: user, error: userError } = await this.supabaseService.getClient()
      .from('users')
      .select('id, stripe_customer_id')
      .eq('phone', magicLink.phone)
      .single();

    if (userError || !user || !user.stripe_customer_id) {
      throw new BadRequestException('Não foi possível encontrar a assinatura atrelada a este número.');
    }

    // 4. Generate Stripe Portal URL
    return this.stripeService.createCustomerPortalSession(user.id);
  }
}
