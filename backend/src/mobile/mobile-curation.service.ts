import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminService } from '../admin/admin.service';

const HIGHLIGHT_ROUTES = new Set([
  '/mobile/',
  '/mobile/liturgy',
  '/mobile/prayers',
  '/mobile/novenas',
]);

export interface MobileHighlightRow {
  id: string;
  title: string;
  subtitle: string;
  target_path: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface MobileCampaignRow {
  id: string;
  title: string;
  body: string;
  target_path: string;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  recipient_count: number;
  failure_count: number;
  created_at: string;
}

interface PushDeviceRow {
  id: string;
  installation_id: string;
  platform: string;
}

interface CampaignSendRow {
  id: string;
  title: string;
  body: string;
  target_path: string;
}

export interface MobileHighlightInput {
  id?: string;
  title: string;
  subtitle: string;
  targetPath: string;
  sortOrder?: number;
  active?: boolean;
}

export interface MobileCampaignInput {
  title: string;
  body: string;
  targetPath?: string;
  scheduledAt?: string;
}

@Injectable()
export class MobileCurationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  async listHighlights() {
    const result = await this.supabaseService
      .getClient()
      .from('mobile_home_highlights')
      .select('id, title, subtitle, target_path, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (result.error) throw result.error;
    return (result.data ?? []) as unknown as Pick<
      MobileHighlightRow,
      'id' | 'title' | 'subtitle' | 'target_path' | 'sort_order'
    >[];
  }

  async listAdminHighlights(adminId: string, authorization?: string) {
    await this.authorizeAdmin(adminId, authorization);
    const result = await this.supabaseService
      .getClient()
      .from('mobile_home_highlights')
      .select(
        'id, title, subtitle, target_path, sort_order, is_active, updated_at',
      )
      .order('sort_order', { ascending: true });
    if (result.error) throw result.error;
    return (result.data ?? []) as unknown as MobileHighlightRow[];
  }

  async listCampaigns(adminId: string, authorization?: string) {
    await this.authorizeAdmin(adminId, authorization);
    const { data, error } = await this.supabaseService
      .getClient()
      .from('mobile_push_campaigns')
      .select(
        'id, title, body, target_path, status, scheduled_at, sent_at, recipient_count, failure_count, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as unknown as MobileCampaignRow[];
  }

  async saveHighlight(
    adminId: string,
    authorization: string | undefined,
    input: MobileHighlightInput,
  ) {
    const admin = (await this.authorizeAdmin(adminId, authorization)) as {
      email: string;
      name: string;
    };
    const title = input.title?.trim();
    const subtitle = input.subtitle?.trim();
    if (!title || title.length > 80 || !subtitle || subtitle.length > 180) {
      throw new BadRequestException(
        'Título (até 80) e subtítulo (até 180) são obrigatórios.',
      );
    }
    if (!HIGHLIGHT_ROUTES.has(input.targetPath)) {
      throw new BadRequestException('Destino de destaque não permitido.');
    }
    const row = {
      ...(input.id ? { id: input.id } : {}),
      title,
      subtitle,
      target_path: input.targetPath,
      sort_order: Math.max(0, Math.min(99, Number(input.sortOrder) || 0)),
      is_active: input.active !== false,
      updated_at: new Date().toISOString(),
    };
    const result = await this.supabaseService
      .getClient()
      .from('mobile_home_highlights')
      .upsert(row)
      .select()
      .single();
    if (result.error) throw result.error;
    const saved = result.data as unknown as MobileHighlightRow;
    await this.adminService.logActivity(
      adminId,
      admin.email,
      admin.name,
      'mobile_highlight_saved',
      { id: saved.id },
    );
    return saved;
  }

  async deleteHighlight(
    adminId: string,
    authorization: string | undefined,
    id: string,
  ) {
    const admin = (await this.authorizeAdmin(adminId, authorization)) as {
      email: string;
      name: string;
    };
    const { error } = await this.supabaseService
      .getClient()
      .from('mobile_home_highlights')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await this.adminService.logActivity(
      adminId,
      admin.email,
      admin.name,
      'mobile_highlight_deleted',
      { id },
    );
    return { deleted: true };
  }

  async registerInstallation(
    authorization: string | undefined,
    installationId: string | undefined,
    platform: string,
  ) {
    const token = this.extractToken(authorization);
    if (
      !installationId ||
      installationId.length > 128 ||
      !['android', 'ios', 'web'].includes(platform)
    ) {
      throw new BadRequestException('Instalação ou plataforma inválida.');
    }
    const supabase = this.supabaseService.getClient();
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user)
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .maybeSingle();
    if (userError || !user)
      throw new UnauthorizedException('Perfil do aplicativo não encontrado.');
    const { error } = await supabase.from('mobile_push_installations').upsert(
      {
        user_id: user.id,
        installation_id: installationId,
        platform,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'installation_id' },
    );
    if (error) throw error;
    return { registered: true };
  }

  async unregisterInstallation(
    authorization: string | undefined,
    installationId: string | undefined,
  ) {
    const token = this.extractToken(authorization);
    const supabase = this.supabaseService.getClient();
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user)
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .maybeSingle();
    if (!user)
      throw new UnauthorizedException('Perfil do aplicativo não encontrado.');
    if (!installationId) throw new BadRequestException('Instalação inválida.');
    let query = supabase
      .from('mobile_push_installations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    query = query.eq('installation_id', installationId);
    const { error } = await query;
    if (error) throw error;
    return { registered: false };
  }

  async createCampaign(
    adminId: string,
    authorization: string | undefined,
    input: MobileCampaignInput,
  ) {
    const admin = (await this.authorizeAdmin(adminId, authorization)) as {
      email: string;
      name: string;
    };
    const title = input.title?.trim();
    const body = input.body?.trim();
    if (!title || title.length > 80 || !body || body.length > 240) {
      throw new BadRequestException(
        'Título (até 80) e mensagem (até 240) são obrigatórios.',
      );
    }
    const targetPath = input.targetPath || '/mobile/';
    if (!HIGHLIGHT_ROUTES.has(targetPath))
      throw new BadRequestException('Destino da campanha não permitido.');
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (
      scheduledAt &&
      (Number.isNaN(scheduledAt.getTime()) ||
        scheduledAt.getTime() < Date.now() + 60_000)
    ) {
      throw new BadRequestException(
        'Agende a campanha para pelo menos um minuto no futuro.',
      );
    }
    const result = await this.supabaseService
      .getClient()
      .from('mobile_push_campaigns')
      .insert({
        title,
        body,
        target_path: targetPath,
        status: scheduledAt ? 'scheduled' : 'queued',
        scheduled_at: scheduledAt?.toISOString() ?? new Date().toISOString(),
        created_by: adminId,
      })
      .select()
      .single();
    if (result.error) throw result.error;
    const created = result.data as unknown as MobileCampaignRow;
    await this.adminService.logActivity(
      adminId,
      admin.email,
      admin.name,
      'mobile_push_campaign_created',
      { id: created.id, status: created.status },
    );
    if (created.status === 'queued') await this.sendCampaign(created.id);
    return created;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendScheduledCampaigns() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('mobile_push_campaigns')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10);
    if (error) {
      console.error(
        'Falha ao buscar campanhas mobile agendadas:',
        error.message,
      );
      return;
    }
    const campaigns = (data ?? []) as unknown as Array<{ id: string }>;
    for (const campaign of campaigns) await this.sendCampaign(campaign.id);
  }

  private async sendCampaign(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data: campaignData } = await supabase
      .from('mobile_push_campaigns')
      .update({ status: 'sending' })
      .eq('id', id)
      .in('status', ['queued', 'scheduled'])
      .select('id, title, body, target_path')
      .maybeSingle();
    const unknownCampaign: unknown = campaignData;
    const campaign = this.isCampaignSendRow(unknownCampaign)
      ? unknownCampaign
      : null;
    if (!campaign) return;
    try {
      const messaging = this.getMessaging();
      const { data: devices, error } = await supabase
        .from('mobile_push_installations')
        .select('id, installation_id, platform')
        .eq('is_active', true);
      if (error) throw error;
      let success = 0;
      let failure = 0;
      const list = (devices ?? []) as unknown as PushDeviceRow[];
      for (let i = 0; i < list.length; i += 500) {
        const batch = list.slice(i, i + 500);
        const publicAppUrl =
          this.configService.get<string>('PUBLIC_APP_URL') ||
          'http://localhost:8081';
        const result = await messaging.sendEach(
          batch.map((device) => ({
            fid: device.installation_id,
            notification: { title: campaign.title, body: campaign.body },
            data: { targetPath: campaign.target_path, campaignId: campaign.id },
            ...(device.platform === 'web'
              ? {
                  webpush: {
                    fcmOptions: {
                      link: new URL(
                        campaign.target_path,
                        publicAppUrl,
                      ).toString(),
                    },
                  },
                }
              : {}),
          })),
        );
        success += result.successCount;
        failure += result.failureCount;
        const invalidIds = batch.flatMap((device, index) => {
          const response = result.responses[index];
          return !response.success &&
            [
              'messaging/registration-token-not-registered',
              'messaging/invalid-registration-token',
            ].includes(response.error?.code ?? '')
            ? [device.id]
            : [];
        });
        if (invalidIds.length)
          await supabase
            .from('mobile_push_installations')
            .update({ is_active: false })
            .in('id', invalidIds);
      }
      await supabase
        .from('mobile_push_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: success,
          failure_count: failure,
        })
        .eq('id', id);
    } catch (error) {
      console.error(`Falha ao enviar campanha mobile ${id}:`, error);
      await supabase
        .from('mobile_push_campaigns')
        .update({ status: 'failed', failure_count: 1 })
        .eq('id', id);
    }
  }

  private getMessaging() {
    const raw = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw)
      throw new ServiceUnavailableException('Firebase Admin não configurado.');
    let serviceAccount: {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('project_id' in parsed) ||
        !('client_email' in parsed) ||
        !('private_key' in parsed) ||
        typeof parsed.project_id !== 'string' ||
        typeof parsed.client_email !== 'string' ||
        typeof parsed.private_key !== 'string'
      ) {
        throw new Error('Missing service account fields');
      }
      serviceAccount = {
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      };
    } catch {
      throw new ServiceUnavailableException(
        'FIREBASE_SERVICE_ACCOUNT_JSON inválido.',
      );
    }
    const projectId =
      this.configService.get<string>('FIREBASE_PROJECT_ID') ||
      serviceAccount.project_id;
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({ ...serviceAccount, projectId }),
        projectId,
      });
    return getMessaging(app);
  }

  private extractToken(authorization?: string) {
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('Token de autenticação ausente.');
    return authorization.substring(7).trim();
  }

  private async authorizeAdmin(adminId: string, authorization?: string) {
    const accessToken = this.extractToken(authorization);
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user || data.user.id !== adminId) {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }
    return this.adminService.getRequesterAdmin(adminId);
  }

  private isCampaignSendRow(value: unknown): value is CampaignSendRow {
    if (typeof value !== 'object' || value === null) return false;
    return (
      'id' in value &&
      typeof value.id === 'string' &&
      'title' in value &&
      typeof value.title === 'string' &&
      'body' in value &&
      typeof value.body === 'string' &&
      'target_path' in value &&
      typeof value.target_path === 'string'
    );
  }
}
