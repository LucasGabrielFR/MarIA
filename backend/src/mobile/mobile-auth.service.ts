import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';
import { MailService } from '../mail/mail.service';

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
    private readonly mailService: MailService,
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

    const hasLetter = /[a-zA-ZÀ-ÿ]/.test(dto.password);
    const hasNumber = /[0-9]/.test(dto.password);
    const hasSymbol = /[^a-zA-Z0-9À-ÿ\s]/.test(dto.password);
    const typesCount = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;

    if (typesCount < 2) {
      throw new BadRequestException(
        'A senha deve conter pelo menos dois tipos diferentes (ex: letras e números, letras e símbolos).',
      );
    }

    const cleanEmail = dto.email.toLowerCase().trim();
    const fullName = `${dto.firstName.trim()} ${dto.lastName ? dto.lastName.trim() : ''}`.trim();

    // 1. Verifica se já existe um usuário com este e-mail em public.users ou public.admins
    const [{ data: existingUser }, { data: existingAdmin }] = await Promise.all([
      supabase.from('users').select('id, email').eq('email', cleanEmail).maybeSingle(),
      supabase.from('admins').select('id, email').eq('email', cleanEmail).maybeSingle(),
    ]);

    if (existingUser || existingAdmin) {
      throw new BadRequestException(
        'Este e-mail já está cadastrado na MarIA. Toque em "Entrar" para acessar sua conta.',
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
      const errMsg = adminCreateError.message?.toLowerCase() || '';
      if (
        errMsg.includes('already') ||
        errMsg.includes('registered') ||
        errMsg.includes('exists') ||
        adminCreateError.status === 422
      ) {
        throw new BadRequestException(
          'Este e-mail já está cadastrado na MarIA. Toque em "Entrar" para acessar sua conta.',
        );
      }

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

      if (signUpError) {
        throw new BadRequestException(
          signUpError.message || 'Falha ao cadastrar usuário.',
        );
      }

      // No Supabase, quando o e-mail já existe e confirmação está ativa, identities vem vazio ([])
      if (
        !signUpData.user ||
        (signUpData.user.identities && signUpData.user.identities.length === 0)
      ) {
        throw new BadRequestException(
          'Este e-mail já está cadastrado na MarIA. Toque em "Entrar" para acessar sua conta.',
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
      throw new BadRequestException(
        loginError?.message || 'Falha ao inicializar sessão. Tente fazer login diretamente.',
      );
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
   * Login/Cadastro no aplicativo via Google OAuth (idToken validado no Supabase Auth).
   */
  async loginWithGoogle(dto: {
    idToken: string;
    accessToken?: string;
  }): Promise<{
    user: MobileUserResponse;
    token: string;
    refreshToken?: string;
  }> {
    const supabase = this.supabaseService.getClient();

    if (!dto.idToken || !dto.idToken.trim()) {
      throw new BadRequestException('O token de identificação do Google (idToken) é obrigatório.');
    }

    // 1. Valida o idToken no Supabase Auth oficial
    const { data: authData, error: authError } =
      await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: dto.idToken.trim(),
        access_token: dto.accessToken?.trim(),
      });

    if (authError || !authData.session || !authData.user) {
      this.logger.error(`[MobileAuth] Falha no login Google: ${authError?.message}`);
      throw new UnauthorizedException(
        authError?.message || 'Falha ao autenticar com o Google.',
      );
    }

    const authUser = authData.user;
    const cleanEmail = (authUser.email || '').toLowerCase().trim();
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      'Fiel MarIA';

    // 2. Localiza registro em public.users
    let { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .or(`auth_user_id.eq.${authUser.id},email.eq.${cleanEmail}`)
      .maybeSingle();

    if (!publicUser) {
      // 3. Primeiro acesso: inicializa perfil em public.users
      const { data: createdUser, error: createError } = await supabase
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

      if (createError) {
        this.logger.error(
          `[MobileAuth] Erro ao criar public.users pós-Google: ${createError.message}`,
        );
        throw new BadRequestException(
          'Falha ao inicializar perfil do usuário com Google.',
        );
      }
      publicUser = createdUser;
    } else {
      // 4. Usuário existente: atualiza vínculo com auth.users se necessário
      const updates: any = {};
      if (!publicUser.auth_user_id) updates.auth_user_id = authUser.id;
      if (!publicUser.email && cleanEmail) updates.email = cleanEmail;
      if ((!publicUser.name || publicUser.name === 'Fiel MarIA') && fullName) {
        updates.name = fullName;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', publicUser.id);
        publicUser = { ...publicUser, ...updates };
      }
    }

    this.logger.log(
      `[MobileAuth] Login Google bem-sucedido para usuário ${publicUser.id} (${cleanEmail})`,
    );

    return {
      user: this.mapUser(publicUser),
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    };
  }

  /**
   * Solicitação de redefinição de senha com envio de código OTP de 6 dígitos via e-mail próprio da MarIA.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!email || !email.trim()) {
      throw new BadRequestException('E-mail é obrigatório.');
    }
    const cleanEmail = email.toLowerCase().trim();
    const supabase = this.supabaseService.getClient();

    // 1. Localiza se o usuário existe em public.users
    const { data: publicUser } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    // Gera código numérico de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Invalida códigos anteriores não utilizados para o mesmo e-mail
    await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('email', cleanEmail)
      .is('used_at', null);

    // Salva o novo código na tabela dedicada
    const { error: insertError } = await supabase.from('password_resets').insert({
      email: cleanEmail,
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      this.logger.error(`[MobileAuth] Falha ao gravar password_resets: ${insertError.message}`);
      throw new BadRequestException('Falha ao processar solicitação de recuperação.');
    }

    // Dispara e-mail com layout sacro oficial da MarIA
    await this.mailService.sendPasswordResetOtpEmail(
      cleanEmail,
      code,
      publicUser?.name,
    );

    return {
      message: 'Código de verificação de 6 dígitos enviado com sucesso para o seu e-mail.',
    };
  }

  /**
   * Redefinição de senha diretamente no app utilizando o código OTP de 6 dígitos.
   */
  async resetPasswordWithOtp(dto: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('E-mail é obrigatório.');
    }
    if (!dto.code || !dto.code.trim()) {
      throw new BadRequestException('Código de verificação de 6 dígitos é obrigatório.');
    }
    if (!dto.newPassword || dto.newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');
    }

    // Regra flexibilizada: mínimo 6 caracteres e pelo menos 2 tipos diferentes
    const hasLetter = /[a-zA-ZÀ-ÿ]/.test(dto.newPassword);
    const hasNumber = /[0-9]/.test(dto.newPassword);
    const hasSymbol = /[^a-zA-Z0-9À-ÿ\s]/.test(dto.newPassword);
    const typesCount = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;

    if (typesCount < 2) {
      throw new BadRequestException(
        'A nova senha deve conter pelo menos dois tipos diferentes (ex: letras e números, letras e símbolos).',
      );
    }

    const cleanEmail = dto.email.toLowerCase().trim();
    const cleanCode = dto.code.trim();
    const supabase = this.supabaseService.getClient();

    // 1. Valida o código na tabela password_resets
    const { data: resetRecord, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', cleanCode)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resetError || !resetRecord) {
      throw new BadRequestException(
        'Código de verificação inválido ou expirado. Verifique os números digitados ou solicite um novo código.',
      );
    }

    // 2. Marca o código como utilizado imediatamente
    await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    // 3. Obtém o auth_user_id do usuário
    let { data: publicUser } = await supabase
      .from('users')
      .select('id, auth_user_id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    let authUserId = publicUser?.auth_user_id;

    if (!authUserId) {
      const { data: authList } = await supabase.auth.admin.listUsers();
      const foundAuth = (authList?.users as any[])?.find(
        (u: any) => (u.email || '').toLowerCase().trim() === cleanEmail,
      );
      authUserId = foundAuth?.id;
    }

    if (!authUserId) {
      throw new BadRequestException('Usuário não localizado no sistema de autenticação.');
    }

    // 4. Atualiza a senha no Supabase Auth via Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUserId,
      { password: dto.newPassword },
    );

    if (updateError) {
      this.logger.error(`[MobileAuth] Falha no updateUserById: ${updateError.message}`);
      throw new BadRequestException('Falha ao atualizar a senha no servidor.');
    }

    this.logger.log(`[MobileAuth] Senha redefinida com sucesso para ${cleanEmail}`);

    return {
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    };
  }

  /**
   * Login no aplicativo a partir de sessão gerada via Supabase Web OAuth (Google).
   */
  async loginWithSupabaseSession(dto: { accessToken: string }): Promise<{
    user: MobileUserResponse;
    token: string;
  }> {
    const supabase = this.supabaseService.getClient();
    if (!dto.accessToken || !dto.accessToken.trim()) {
      throw new BadRequestException('Token de sessão é obrigatório.');
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(
      dto.accessToken.trim(),
    );

    if (authError || !authData.user) {
      this.logger.error(`[MobileAuth] Falha ao obter usuário pelo token: ${authError?.message}`);
      throw new UnauthorizedException('Token de autenticação inválido ou expirado.');
    }

    const authUser = authData.user;
    const cleanEmail = (authUser.email || '').toLowerCase().trim();
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      'Fiel MarIA';

    let { data: publicUser } = await supabase
      .from('users')
      .select('*')
      .or(`auth_user_id.eq.${authUser.id},email.eq.${cleanEmail}`)
      .maybeSingle();

    if (!publicUser) {
      const { data: createdUser, error: createError } = await supabase
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

      if (createError) {
        throw new BadRequestException('Falha ao inicializar perfil do usuário.');
      }
      publicUser = createdUser;
    } else {
      const updates: any = {};
      if (!publicUser.auth_user_id) updates.auth_user_id = authUser.id;
      if (!publicUser.email && cleanEmail) updates.email = cleanEmail;
      if ((!publicUser.name || publicUser.name === 'Fiel MarIA') && fullName) {
        updates.name = fullName;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', publicUser.id);
        publicUser = { ...publicUser, ...updates };
      }
    }

    return {
      user: this.mapUser(publicUser),
      token: dto.accessToken.trim(),
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
   * Normaliza qualquer telefone brasileiro para incluir o DDI 55 caso não tenha sido informado.
   */
  private normalizePhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
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

    const cleanPhone = this.normalizePhone(phone);
    if (cleanPhone.length < 12) {
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
      this.logger.error(`[MobileAuth] Falha no disparo Uazapi para targetChat: ${targetChat}`);
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

    const cleanPhone = this.normalizePhone(phone);
    const rawDigitsWithoutDdi = cleanPhone.startsWith('55')
      ? cleanPhone.substring(2)
      : cleanPhone;
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
        `phone.eq.${cleanPhone},phone.eq.${rawDigitsWithoutDdi},phone.eq.+${cleanPhone},phone.eq.+${rawDigitsWithoutDdi},wa_chatid.ilike.%${rawDigitsWithoutDdi}%`,
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
