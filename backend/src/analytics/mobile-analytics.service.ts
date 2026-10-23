import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const EVENT_TYPES = new Set([
  'session_start',
  'session_end',
  'screen_view',
  'screen_exit',
  'app_error',
]);

export interface MobileAnalyticsEventDto {
  type: string;
  screen?: string;
  sessionId: string;
  platform?: string;
  appVersion?: string;
  durationMs?: number;
  occurredAt?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

@Injectable()
export class MobileAnalyticsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async registerEvents(
    authorization: string | undefined,
    events: MobileAnalyticsEventDto[],
  ) {
    const token = this.extractToken(authorization);
    if (!Array.isArray(events) || events.length === 0 || events.length > 100) {
      throw new BadRequestException(
        'Envie entre 1 e 100 eventos de telemetria.',
      );
    }

    const supabase = this.supabaseService.getClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();
    if (userError || !user) {
      throw new UnauthorizedException('Perfil do aplicativo não encontrado.');
    }

    const rows = events.map((event) => this.toRow(event, user.id));
    const { error } = await supabase
      .from('mobile_analytics_events')
      .insert(rows);
    if (error) throw error;

    return { accepted: rows.length };
  }

  private toRow(event: MobileAnalyticsEventDto, userId: string) {
    if (!EVENT_TYPES.has(event.type)) {
      throw new BadRequestException(
        `Tipo de evento não suportado: ${event.type}`,
      );
    }
    if (!event.sessionId || event.sessionId.length > 120) {
      throw new BadRequestException('Identificador de sessão inválido.');
    }
    if (event.screen && !/^[a-zA-Z0-9_/-]{1,80}$/.test(event.screen)) {
      throw new BadRequestException('Nome de tela inválido.');
    }
    if (
      event.durationMs !== undefined &&
      (!Number.isFinite(event.durationMs) ||
        event.durationMs < 0 ||
        event.durationMs > 86_400_000)
    ) {
      throw new BadRequestException('Duração de tela inválida.');
    }

    const occurredAt = event.occurredAt
      ? new Date(event.occurredAt)
      : new Date();
    if (
      Number.isNaN(occurredAt.getTime()) ||
      occurredAt.getTime() > Date.now() + 300_000
    ) {
      throw new BadRequestException('Data do evento inválida.');
    }

    return {
      user_id: userId,
      event_type: event.type,
      screen_name: event.screen || null,
      session_id: event.sessionId,
      platform: event.platform?.slice(0, 30) || null,
      app_version: event.appVersion?.slice(0, 40) || null,
      duration_ms: event.durationMs ?? null,
      metadata: event.metadata || {},
      occurred_at: occurredAt.toISOString(),
    };
  }

  private extractToken(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação ausente.');
    }
    return authorization.substring(7).trim();
  }
}
