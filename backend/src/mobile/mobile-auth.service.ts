import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';

export class MobileSignUpDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class MobileLoginDto {
  email: string;
  password: string;
}

export interface MobileUserResponse {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  phone?: string;
  isWhatsappLinked: boolean;
  subscriptionTier: string;
  origin: string;
  receiveDailyLiturgy: boolean;
  receiveDailyExam: boolean;
  receiveDailySaint: boolean;
  whatsappBridgeEnabled: boolean;
}

@Injectable()
export class MobileAuthService {
  private readonly logger = new Logger(MobileAuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly uazapiService: UazapiService,
  ) {}

  /**
   * Cadastro de novo usuário via E-mail e Senha no app.
   */
  async signUp(dto: MobileSignUpDto): Promise<{
    user: MobileUserResponse;
    token: string;
    refreshToken?: string;
  }> {
    const supabase = this.supabaseService.getClient();

    if (!dto.firstName || !dto.firstName.trim()) {
      throw new BadRequestException('O nome é obrigatório.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('O e-mail é obrigatório.');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('A senha deve ter no mínimo 6 caracteres.');
    }

    const cleanEmail = dto.email.toLowerCase().trim();
    const fullName = `${dto.firstName.trim()} ${dto.lastName ? dto.lastName.trim() : ''}`.trim();

    // 1. Verifica se já existe um usuário com este e-mail em public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      throw new BadRequestException(
        'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
      );
    }

    // 2. Cria usuário no Supabase Auth com email_confirm: true para experiência ágil
    let authUser: any = null;
    const { data: adminCreated, error: adminCreateError } =
      await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          name: fullName,
          first_name: dto.firstName.trim(),
          last_name: dto.lastName ? dto.lastName.trim() : '',
        },
      });

    if (adminCreateError) {
      // Fallback para signUp comum caso admin API tenha restrições
      this.logger.warn(
        `[MobileAuth] admin.createUser falhou, tentando auth.signUp: ${adminCreateError.message}`,
      );
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: dto.password,
        options: {
          data: {
            name: fullName,
          },
        },
      });
      if (signUpError || !signUpData.user) {
        throw new BadRequestException(
          signUpError?.message || 'Falha ao cadastrar usuário.',
        );
      }
      authUser = signUpData.user;
    } else {
      authUser = adminCreated.user;
    }

    // 3. Efetua login para gerar o token de sessão oficial
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: dto.password,
      });

    if (loginError || !loginData.session) {
      this.logger.error(`[MobileAuth] Erro ao logar pós-cadastro: ${loginError?.message}`);
      throw new BadRequestException('Usuário criado, mas falhou ao gerar sessão.');
    }

    // 4. Cria registro em public.users
    const { data: publicUser, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUser.id,
        email: cleanEmail,
        name: fullName,
        status: 'active',
        origin: 'mobile',
        subscription_tier: 'free',
        receive_daily_liturgy: true,
        receive_daily_exam: true,
        receive_daily_saint: false,
        whatsapp_bridge_enabled: true,
      })
      .select()
      .single();

    if (insertError) {
      this.logger.error(`[MobileAuth] Erro ao criar public.users: ${insertError.message}`);
      throw new BadRequestException('Falha ao inicializar perfil do usuário.');
    }

    this.logger.log(`[MobileAuth] Novo usuário cadastrado: ${publicUser.id} (${cleanEmail})`);

    return {
      user: this.mapUser(publicUser),
      token: loginData.session.access_token,
      refreshToken: loginData.session.refresh_token,
    };
  }

  /**
   * Login do usuário no app via E-mail e Senha.
   */
  async login(dto: MobileLoginDto): Promise<{
    user: MobileUserResponse;
    token: string;
    refreshToken?: string;
  }> {
    const supabase = this.supabaseService.getClient();

    if (!dto.email || !dto.password) {
      throw new BadRequestException('E-mail e senha são obrigatórios.');
    }

    const cleanEmail = dto.email.toLowerCase().trim();

    // 1. Efetua login no Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: dto.password,
      });

    if (authError || !authData.session || !authData.user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // 2. Busca registro em public.users
    let { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .or(`auth_user_id.eq.${authData.user.id},email.eq.${cleanEmail}`)
      .maybeSingle();

    // Se o usuário ainda não tiver vínculo em public.users, cria ou atualiza
    if (!publicUser) {
      const name = authData.user.user_metadata?.name || 'Fiel MarIA';
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email: cleanEmail,
          name,
          status: 'active',
          origin: 'mobile',
          subscription_tier: 'free',
          receive_daily_liturgy: true,
          receive_daily_exam: true,
          receive_daily_saint: false,
          whatsapp_bridge_enabled: true,
        })
        .select()
        .single();

      if (createError) {
        this.logger.error(`[MobileAuth] Erro ao sincronizar public.users no login: ${createError.message}`);
      }
      publicUser = createdUser;
    } else if (!publicUser.auth_user_id) {
      // Atualiza vínculo se faltava
      await supabase
        .from('users')
        .update({ auth_user_id: authData.user.id, email: cleanEmail })
        .eq('id', publicUser.id);
      publicUser.auth_user_id = authData.user.id;
    }

    return {
      user: this.mapUser(publicUser),
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    };
  }

  /**
   * Solicitação de redefinição de senha por e-mail padrão do Supabase.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }
    const cleanEmail = email.toLowerCase().trim();
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) {
      this.logger.warn(`[MobileAuth] Falha no resetPasswordForEmail: ${error.message}`);
    }

    // Resposta amigável e segura (não confirma existência de conta)
    return {
      message:
        'Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha.',
    };
  }

  /**
   * Obtém os dados do usuário autenticado a partir do token Bearer.
   */
  async getMe(authHeader?: string): Promise<MobileUserResponse> {
    const token = this.extractToken(authHeader);
    const supabase = this.supabaseService.getClient();

    const { data: authUser, error } = await supabase.auth.getUser(token);
    if (error || !authUser.user) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    const { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .or(`auth_user_id.eq.${authUser.user.id},email.eq.${authUser.user.email}`)
      .maybeSingle();

    if (!publicUser) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }

    return this.mapUser(publicUser);
  }

  /**
   * Dispara o código OTP de 6 dígitos via Uazapi para o WhatsApp do fiel.
   */
  async sendWhatsAppCode(
    userId: string,
    phone: string,
  ): Promise<{ message: string }> {
    if (!phone) {
      throw new BadRequestException('O número de WhatsApp é obrigatório.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new BadRequestException('Número de telefone inválido com DDD.');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Válido por 15 minutos

    // 2. Limpa códigos antigos pendentes deste usuário
    await supabase
      .from('magic_links')
      .delete()
      .eq('user_id', userId)
      .eq('used', false);

    // 3. Salva novo código
    const { error: insertError } = await supabase.from('magic_links').insert({
      user_id: userId,
      token: code,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (insertError) {
      this.logger.error(`[MobileAuth] Erro ao salvar OTP: ${insertError.message}`);
      throw new BadRequestException('Falha ao gerar código de verificação.');
    }

    // 4. Monta mensagem sacra de confirmação
    const message =
      `Salve Maria! 🕊️\n\n` +
      `Recebemos sua solicitação para vincular seu WhatsApp ao aplicativo *MarIA*.\n\n` +
      `Seu código de confirmação é:\n\n` +
      `*${code}*\n\n` +
      `Insira este código no aplicativo para ativar seus lembretes e sincronizar suas orações. Válido por 15 minutos.\n\n` +
      `Se você não solicitou este código, apenas desconsidere esta mensagem.`;

    const targetChat = `${cleanPhone}@s.whatsapp.net`;
    const sent = await this.uazapiService.sendMessage(targetChat, message);

    if (!sent) {
      throw new BadRequestException(
        'Falha ao enviar o código pelo WhatsApp. Verifique se o número informado está correto.',
      );
    }

    this.logger.log(`[MobileAuth] Código OTP enviado para WhatsApp ${cleanPhone} (user: ${userId})`);

    return {
      message: 'Código de verificação enviado com sucesso para o seu WhatsApp.',
    };
  }

  /**
   * Valida o código OTP e realiza a união inteligente (Smart Merge) das contas.
   */
  async verifyWhatsAppCode(
    userId: string,
    phone: string,
    code: string,
  ): Promise<MobileUserResponse> {
    if (!phone || !code) {
      throw new BadRequestException('Telefone e código são obrigatórios.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const supabase = this.supabaseService.getClient();

    // 1. Valida o código em magic_links
    const { data: records, error } = await supabase
      .from('magic_links')
      .select('*')
      .eq('user_id', userId)
      .eq('token', code.trim())
      .order('created_at', { ascending: false })
      .limit(1);

    const record = records?.[0];

    if (error || !record) {
      throw new BadRequestException('Código de verificação incorreto.');
    }
    if (record.used) {
      throw new BadRequestException('Este código já foi utilizado. Solicite um novo.');
    }
    if (new Date(record.expires_at) < new Date()) {
      throw new BadRequestException('Este código expirou. Solicite um novo.');
    }

    // Marca como usado
    await supabase.from('magic_links').update({ used: true }).eq('id', record.id);

    // 2. Busca o usuário atual do app
    const { data: currentAppUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!currentAppUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // 3. Smart Merge: Verifica se já existe um usuário com esse telefone no banco
    const { data: existingWppUser } = await supabase
      .from('users')
      .select('*')
      .or(
        `phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.55${cleanPhone},wa_chatid.ilike.%${cleanPhone}%`,
      )
      .maybeSingle();

    if (existingWppUser && existingWppUser.id !== userId) {
      // CENÁRIO SMART MERGE: O usuário já era cadastrado no WhatsApp anteriormente!
      this.logger.log(
        `[MobileAuth Smart Merge] Unificando conta mobile (${userId}) na conta WhatsApp existente (${existingWppUser.id})`,
      );

      // A) Migra Novenas criadas no app para o usuário definitivo
      await supabase
        .from('user_novenas')
        .update({ user_id: existingWppUser.id })
        .eq('user_id', userId);

      // B) Migra Plano de Vida Espiritual
      const { data: mobilePlan } = await supabase
        .from('user_spiritual_plans')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (mobilePlan && mobilePlan.habits && mobilePlan.habits.length > 0) {
        const { data: existingPlan } = await supabase
          .from('user_spiritual_plans')
          .select('*')
          .eq('user_id', existingWppUser.id)
          .maybeSingle();

        if (existingPlan) {
          // Concatena hábitos não duplicados
          const existingIds = new Set((existingPlan.habits || []).map((h: any) => h.id));
          const newHabits = (mobilePlan.habits || []).filter(
            (h: any) => !existingIds.has(h.id),
          );
          await supabase
            .from('user_spiritual_plans')
            .update({
              habits: [...(existingPlan.habits || []), ...newHabits],
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPlan.id);
          await supabase.from('user_spiritual_plans').delete().eq('id', mobilePlan.id);
        } else {
          await supabase
            .from('user_spiritual_plans')
            .update({ user_id: existingWppUser.id })
            .eq('id', mobilePlan.id);
        }
      }

      // C) Migra Lembretes
      await supabase
        .from('reminders')
        .update({ user_id: existingWppUser.id })
        .eq('user_id', userId);

      // D) Atualiza conta oficial com os dados de login e nome do app
      const updatePayload: any = {
        auth_user_id: currentAppUser.auth_user_id,
        email: currentAppUser.email,
        origin: 'omnichannel',
        whatsapp_bridge_enabled: true,
        updated_at: new Date().toISOString(),
      };

      if (
        !existingWppUser.name ||
        existingWppUser.name === 'Fiel' ||
        existingWppUser.name === 'Fiel MarIA'
      ) {
        updatePayload.name = currentAppUser.name;
      }

      const { data: mergedUser } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', existingWppUser.id)
        .select()
        .single();

      // E) Remove a conta temporária do app para evitar duplicidade
      await supabase.from('users').delete().eq('id', userId);

      this.logger.log(`[MobileAuth Smart Merge] Sucesso! Conta unificada sob ID ${existingWppUser.id}`);

      return this.mapUser(mergedUser || existingWppUser);
    }

    // CENÁRIO PADRÃO: Número novo, apenas atualiza o usuário atual
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        phone: cleanPhone,
        wa_chatid: `${cleanPhone}@s.whatsapp.net`,
        whatsapp_bridge_enabled: true,
        origin: currentAppUser.origin === 'mobile' ? 'omnichannel' : currentAppUser.origin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedUser) {
      this.logger.error(`[MobileAuth] Erro ao vincular telefone: ${updateError?.message}`);
      throw new BadRequestException('Falha ao salvar telefone vinculado.');
    }

    this.logger.log(`[MobileAuth] WhatsApp vinculado com sucesso para ${userId} (${cleanPhone})`);

    return this.mapUser(updatedUser);
  }

  private mapUser(row: any): MobileUserResponse {
    return {
      id: row.id,
      authUserId: row.auth_user_id,
      name: row.name || 'Fiel Devoto',
      email: row.email || '',
      phone: row.phone || undefined,
      isWhatsappLinked: !!row.wa_chatid || !!row.phone,
      subscriptionTier: row.subscription_tier || 'free',
      origin: row.origin || 'mobile',
      receiveDailyLiturgy: row.receive_daily_liturgy ?? true,
      receiveDailyExam: row.receive_daily_exam ?? true,
      receiveDailySaint: row.receive_daily_saint ?? false,
      whatsappBridgeEnabled: row.whatsapp_bridge_enabled ?? true,
    };
  }

  private extractToken(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sessão expirada ou não autenticada.');
    }
    return authHeader.substring(7).trim();
  }
}
