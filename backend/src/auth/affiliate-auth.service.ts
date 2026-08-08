import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AffiliateAuthService {
  constructor(private supabaseService: SupabaseService) {}

  async login(username: string, pass: string) {
    const supabase = this.supabaseService.getClient();

    // Buscar afiliado pelo username
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('id, name, code, password_hash, is_active')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error || !affiliate) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    if (!affiliate.is_active) {
      throw new UnauthorizedException('Conta de afiliado desativada.');
    }

    if (!affiliate.password_hash) {
      throw new UnauthorizedException('Usuário não possui senha configurada.');
    }

    // Verificar senha
    const isPasswordValid = pass === affiliate.password_hash;
    if (!isPasswordValid) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    // Gerar token JWT
    // JWT_SECRET deve estar configurado no .env, usaremos um default para desenvolvimento seguro
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_KEY || 'default-secret';
    
    const token = jwt.sign(
      { 
        sub: affiliate.id,
        role: 'affiliate',
        code: affiliate.code,
        name: affiliate.name 
      },
      secret,
      { expiresIn: '7d' } // Expira em 7 dias
    );

    return {
      user: {
        id: affiliate.id,
        name: affiliate.name,
        code: affiliate.code,
        role: 'affiliate'
      },
      token: token,
    };
  }
}
