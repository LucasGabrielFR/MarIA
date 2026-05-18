import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async login(email: string, pass: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('name, role, email, requires_password_change')
      .eq('id', data.user.id)
      .single();

    if (adminError || !admin) {
      throw new UnauthorizedException('Você não possui acesso de administrador.');
    }

    // Registrar log de auditoria
    await supabase.from('activity_logs').insert({
      admin_id: data.user.id,
      admin_email: data.user.email,
      admin_name: admin.name,
      action: 'login',
      details: { description: 'Efetuou login no painel administrativo.' }
    });

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: admin.name,
        role: admin.role,
        requires_password_change: admin.requires_password_change,
      },
      session: data.session,
    };
  }

  async changePassword(email: string, pass: string, newPass: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Efetua login temporário para validar a senha atual
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (loginError) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    // 2. Atualiza a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPass,
    });

    if (updateError) {
      throw new UnauthorizedException(updateError.message);
    }

    // 3. Busca o registro na tabela de admins
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, name, email, role')
      .eq('id', loginData.user.id)
      .single();

    if (adminError || !admin) {
      throw new UnauthorizedException('Administrador não encontrado no sistema.');
    }

    // 4. Marca requires_password_change como falso
    const { error: dbError } = await supabase
      .from('admins')
      .update({ requires_password_change: false, updated_at: new Date().toISOString() })
      .eq('id', admin.id);

    if (dbError) {
      throw new UnauthorizedException('Erro ao atualizar dados cadastrais do administrador.');
    }

    // 5. Grava log de auditoria
    await supabase.from('activity_logs').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      admin_name: admin.name,
      action: 'change_password',
      details: { description: 'Redefiniu a senha de acesso com sucesso no primeiro login.' }
    });

    return {
      success: true,
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        name: admin.name,
        role: admin.role,
        requires_password_change: false,
      },
      session: loginData.session,
    };
  }
}
