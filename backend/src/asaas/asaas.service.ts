import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';

/** Imagem 1x1 PNG transparente (exigida pelo Checkout Asaas nos itens). */
const CHECKOUT_PLACEHOLDER_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

type PlanId = 'basic' | 'premium';
type BillingCycle = 'monthly' | 'annual';

interface PlanConfig {
  value: number;
  cycleAsaas: 'MONTHLY' | 'YEARLY';
  description: string;
  linkName: string;
  itemName: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiKey =
    process.env.ASAAS_API_KEY || process.env.ASAAS_TOKEN || '';
  private readonly apiUrl =
    process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  constructor(
    private readonly supabase: SupabaseService,
    private readonly uazapi: UazapiService,
  ) {}

  private getPlanConfig(planId: PlanId, cycle: BillingCycle): PlanConfig {
    const configs: Record<PlanId, Record<BillingCycle, PlanConfig>> = {
      basic: {
        monthly: {
          value: 14.9,
          cycleAsaas: 'MONTHLY',
          description: 'Plano Básico Mensal - MarIA',
          linkName: 'MarIA - Plano Básico Mensal',
          itemName: 'MarIA Básico Mensal',
        },
        annual: {
          value: 154.8,
          cycleAsaas: 'YEARLY',
          description: 'Plano Básico Anual - MarIA',
          linkName: 'MarIA - Plano Básico Anual',
          itemName: 'MarIA Básico Anual',
        },
      },
      premium: {
        monthly: {
          value: 29.9,
          cycleAsaas: 'MONTHLY',
          description: 'Plano Premium Mensal - MarIA',
          linkName: 'MarIA - Plano Premium Mensal',
          itemName: 'MarIA Premium Mensal',
        },
        annual: {
          value: 322.8,
          cycleAsaas: 'YEARLY',
          description: 'Plano Premium Anual - MarIA',
          linkName: 'MarIA - Plano Premium Anual',
          itemName: 'MarIA Premium Anual',
        },
      },
    };

    const cfg = configs[planId]?.[cycle];
    if (!cfg) {
      throw new BadRequestException('Plano ou ciclo inválido');
    }
    return cfg;
  }

  private normalizePhone(phone: string): string {
    return (phone || '').replace(/\D/g, '');
  }

  private buildExternalReference(
    planId: PlanId,
    cycle: BillingCycle,
    phone: string,
  ): string {
    return `${planId}_${cycle}_${this.normalizePhone(phone)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private async request(endpoint: string, method: string, data?: any) {
    const url = `${this.apiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
        'User-Agent': 'MarIA/1.0',
      },
      ...(data && { body: JSON.stringify(data) }),
    };

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      this.logger.error(`Asaas API error [${method} ${endpoint}]: ${JSON.stringify(result)}`);
      throw new Error(result?.errors?.[0]?.description || 'Erro na integração com Asaas');
    }

    return result;
  }

  private parseExternalReference(externalReference?: string): {
    planTier: string;
    cycle?: string;
    phone: string | null;
  } {
    if (!externalReference) {
      return { planTier: 'basic', phone: null };
    }

    const parts = externalReference.split('_');
    if (parts.length >= 3) {
      return {
        planTier: parts[0],
        cycle: parts[1],
        phone: parts.slice(2).join('_'),
      };
    }

    return { planTier: parts[0] || 'basic', phone: null };
  }

  private async findAsaasCustomerByPhone(phone: string): Promise<string | null> {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) return null;

    try {
      // Tenta buscar com o telefone normalizado
      let response = await this.request(`/customers?mobilePhone=${normalizedPhone}`, 'GET');
      if (response.data && response.data.length > 0) {
        return response.data[0].id;
      }

      response = await this.request(`/customers?phone=${normalizedPhone}`, 'GET');
      if (response.data && response.data.length > 0) {
        return response.data[0].id;
      }

      // Se o telefone começa com 55 (DDI Brasil), tenta buscar também sem o 55
      if (normalizedPhone.startsWith('55') && normalizedPhone.length > 10) {
        const phoneWithoutDDI = normalizedPhone.substring(2);
        
        response = await this.request(`/customers?mobilePhone=${phoneWithoutDDI}`, 'GET');
        if (response.data && response.data.length > 0) {
          return response.data[0].id;
        }

        response = await this.request(`/customers?phone=${phoneWithoutDDI}`, 'GET');
        if (response.data && response.data.length > 0) {
          return response.data[0].id;
        }
      }
    } catch (err) {
      this.logger.warn(`Erro ao buscar cliente no Asaas por telefone: ${err.message}`);
    }

    return null;
  }

  private async ensureAsaasCustomer(
    phone: string,
    displayName?: string | null,
  ): Promise<{ customerId: string; userId?: string }> {
    const normalizedPhone = this.normalizePhone(phone);

    const { data: user } = await this.supabase
      .getClient()
      .rpc('find_user_by_normalized_phone', { phone_query: phone })
      .maybeSingle() as any;

    if (user?.asaas_customer_id) {
      return { customerId: user.asaas_customer_id, userId: user.id };
    }

    // Busca no Asaas para evitar duplicações de clientes
    const existingCustomerId = await this.findAsaasCustomerByPhone(phone);
    if (existingCustomerId) {
      this.logger.log(
        `Cliente existente encontrado no Asaas: ${existingCustomerId} para o telefone ${normalizedPhone}`
      );
      if (user?.id) {
        await this.supabase
          .getClient()
          .from('users')
          .update({ asaas_customer_id: existingCustomerId })
          .eq('id', user.id);
      }
      return { customerId: existingCustomerId, userId: user?.id };
    }

    const customerPayload = {
      name: displayName || user?.name || `Cliente MarIA ${normalizedPhone}`,
      mobilePhone: normalizedPhone,
      phone: normalizedPhone,
      notificationDisabled: false,
    };

    const customer = await this.request('/customers', 'POST', customerPayload);

    if (user?.id) {
      await this.supabase
        .getClient()
        .from('users')
        .update({ asaas_customer_id: customer.id })
        .eq('id', user.id);
    }

    return { customerId: customer.id, userId: user?.id };
  }

  /**
   * Link de pagamento recorrente (documentação: POST /v3/paymentLinks, chargeType RECURRENT).
   * billingType CREDIT_CARD restringe a página apenas a cartão de crédito.
   */
  private async createRecurrentPaymentLink(
    planId: PlanId,
    cycle: BillingCycle,
    phone: string,
  ): Promise<{ url: string; id: string }> {
    const cfg = this.getPlanConfig(planId, cycle);
    const externalReference = this.buildExternalReference(planId, cycle, phone);

    const payload = {
      name: cfg.linkName,
      description: cfg.description,
      value: cfg.value,
      billingType: 'CREDIT_CARD',
      chargeType: 'RECURRENT',
      subscriptionCycle: cfg.cycleAsaas,
      externalReference,
    };

    this.logger.log(`Creating Asaas payment link: ${JSON.stringify(payload)}`);
    const link = await this.request('/paymentLinks', 'POST', payload);

    if (!link.url) {
      throw new Error('Asaas não retornou URL do link de pagamento');
    }

    return { url: link.url, id: link.id };
  }

  /**
   * Checkout hospedado (documentação: POST /v3/checkouts, chargeTypes RECURRENT).
   * Retorna link pronto para o cliente concluir o pagamento.
   */
  private async createHostedCheckout(
    planId: PlanId,
    cycle: BillingCycle,
    phone: string,
    customerId?: string,
    customerName?: string | null,
  ): Promise<string> {
    const cfg = this.getPlanConfig(planId, cycle);
    const normalizedPhone = this.normalizePhone(phone);
    const externalReference = this.buildExternalReference(planId, cycle, phone);

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);

    const successUrl =
      process.env.ASAAS_CHECKOUT_SUCCESS_URL ||
      'https://maria.acutistech.com.br/?checkout=success';
    const cancelUrl =
      process.env.ASAAS_CHECKOUT_CANCEL_URL ||
      'https://maria.acutistech.com.br/?checkout=cancel';

    const payload: Record<string, unknown> = {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 120, // Expira em 2 horas caso não seja pago, liberando recursos
      externalReference,
      callback: {
        successUrl,
        cancelUrl,
        autoRedirect: true,
      },
      items: [
        {
          name: cfg.itemName.substring(0, 30),
          description: cfg.description.substring(0, 150),
          quantity: 1,
          value: cfg.value,
          imageBase64: CHECKOUT_PLACEHOLDER_IMAGE_BASE64,
        },
      ],
      subscription: {
        cycle: cfg.cycleAsaas,
        nextDueDate: this.formatDate(nextDue),
      },
    };

    if (customerId) {
      payload.customer = customerId;
    } else {
      payload.customerData = {
        name: customerName || `Cliente MarIA`,
        phone: normalizedPhone,
      };
    }

    this.logger.log(`Creating Asaas checkout session for ${externalReference}`);
    const checkout = await this.request('/checkouts', 'POST', payload);

    if (!checkout.link) {
      throw new Error('Asaas não retornou link do checkout');
    }

    return checkout.link;
  }

  /**
   * Assinatura + primeira cobrança com invoiceUrl (documentação: POST /v3/subscriptions).
   */
  private async createSubscriptionInvoiceUrl(
    planId: PlanId,
    cycle: BillingCycle,
    phone: string,
    customerId: string,
  ): Promise<string> {
    const cfg = this.getPlanConfig(planId, cycle);
    const externalReference = this.buildExternalReference(planId, cycle, phone);

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);

    const subscriptionPayload = {
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: cfg.value,
      nextDueDate: this.formatDate(nextDue),
      cycle: cfg.cycleAsaas,
      description: cfg.description,
      externalReference,
    };

    this.logger.log(`Creating Asaas subscription: ${JSON.stringify(subscriptionPayload)}`);
    const subscription = await this.request('/subscriptions', 'POST', subscriptionPayload);
    this.logger.log(`Subscription created: ${subscription.id}`);

    let invoiceUrl: string | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      const payments = await this.request(
        `/subscriptions/${subscription.id}/payments?status=PENDING&limit=5&order=asc`,
        'GET',
      );

      const pending = payments.data?.find((p: any) => p.invoiceUrl);
      if (pending?.invoiceUrl) {
        invoiceUrl = pending.invoiceUrl;
        break;
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!invoiceUrl) {
      this.logger.error(`No invoiceUrl for subscription ${subscription.id}`);
      throw new Error(
        'A assinatura foi criada, mas a fatura ainda não está disponível. Tente novamente em alguns instantes.',
      );
    }

    return invoiceUrl;
  }

  async createCheckoutUrl(
    planId: string,
    cycle: string,
    phone: string,
    userId?: string,
  ): Promise<{ url: string }> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY/ASAAS_TOKEN not set. Returning dummy URL.');
      return { url: 'https://sandbox.asaas.com/checkout/dummy' };
    }

    const normalizedPlan = planId as PlanId;
    const normalizedCycle = cycle as BillingCycle;
    if (!['basic', 'premium'].includes(normalizedPlan)) {
      throw new BadRequestException('Plano inválido');
    }
    if (!['monthly', 'annual'].includes(normalizedCycle)) {
      throw new BadRequestException('Ciclo inválido');
    }

    try {
      const { url, id: linkId } = await this.createRecurrentPaymentLink(
        normalizedPlan,
        normalizedCycle,
        phone,
      );

      let resolvedUserId = userId;
      if (!resolvedUserId) {
        const { data: matchedUser } = await this.supabase
          .getClient()
          .rpc('find_user_by_normalized_phone', { phone_query: phone })
          .maybeSingle() as any;
        resolvedUserId = matchedUser?.id;
      }

      if (resolvedUserId) {
        await this.supabase
          .getClient()
          .from('users')
          .update({ asaas_payment_link_id: linkId })
          .eq('id', resolvedUserId);
        this.logger.log(`Linked payment link ID ${linkId} to user ${resolvedUserId}`);
      }

      this.logger.log(`Checkout URL via paymentLink (credit card only): ${url}`);
      return { url };
    } catch (err) {
      this.logger.error(`Falha ao gerar link de pagamento recorrente Asaas: ${err.message}`);
      throw err;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY not set. Skipping cancellation in sandbox.');
      return;
    }
    try {
      this.logger.log(`Cancelling subscription ${subscriptionId} in Asaas...`);
      await this.request(`/subscriptions/${subscriptionId}`, 'DELETE');
      this.logger.log(`Subscription ${subscriptionId} cancelled successfully in Asaas.`);
    } catch (error) {
      this.logger.error(
        `Error cancelling subscription ${subscriptionId} in Asaas: ${error.message}`,
      );
      throw error;
    }
  }

  async handleWebhook(event: any) {
    this.logger.log(`Received Asaas Webhook: ${event.event}`);

    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
      const payment = event.payment;
      const subscriptionId = payment.subscription;
      const customerId = payment.customer;
      const externalReference = payment.externalReference;
      const paymentLinkId = payment.paymentLink;

      if (!subscriptionId) return { received: true };

      const parsed = this.parseExternalReference(externalReference);
      let planTier = parsed.planTier;

      if (planTier !== 'basic' && planTier !== 'premium') {
        if (payment.value >= 29.9) planTier = 'premium';
        else planTier = 'basic';
      }

      const supabaseClient = this.supabase.getClient();
      let user: any = null;

      // 1. Busca prioritária pelo ID do link de pagamento
      if (paymentLinkId) {
        const { data: matchedUser } = await supabaseClient
          .from('users')
          .select('*')
          .eq('asaas_payment_link_id', paymentLinkId)
          .maybeSingle();
        user = matchedUser;
        if (user) {
          this.logger.log(`User ${user.id} matched via paymentLink ID: ${paymentLinkId}`);
        }
      }

      // 2. Fallback pela referência existente do customerId
      if (!user && customerId) {
        const { data: matchedUser } = await supabaseClient
          .from('users')
          .select('*')
          .eq('asaas_customer_id', customerId)
          .maybeSingle();
        user = matchedUser;
        if (user) {
          this.logger.log(`User ${user.id} matched via asaas_customer_id: ${customerId}`);
        }
      }

      // 3. Fallback pela busca resiliente de telefone
      if (!user) {
        let phone = parsed.phone;

        if (!phone && customerId) {
          try {
            const customer = await this.request(`/customers/${customerId}`, 'GET');
            phone = this.normalizePhone(customer.mobilePhone || customer.phone || '');
            this.logger.log(`Phone retrieved from Asaas Customer API: ${phone}`);
          } catch (custErr) {
            this.logger.warn(`Erro ao buscar dados do cliente ${customerId} no Asaas: ${custErr.message}`);
          }
        }

        if (phone) {
          const { data: matchedUser } = await supabaseClient
            .rpc('find_user_by_normalized_phone', { phone_query: phone })
            .maybeSingle();
          user = matchedUser;
          if (user) {
            this.logger.log(`User ${user.id} matched via phone: ${phone}`);
          }
        }
      }

      if (user) {
        const oldSubscriptionId = user.asaas_subscription_id;

        if (oldSubscriptionId && oldSubscriptionId !== subscriptionId) {
          this.logger.log(
            `Upgrade detectado para ${user.id}. Cancelando assinatura ${oldSubscriptionId}...`,
          );
          try {
            await this.cancelSubscription(oldSubscriptionId);
          } catch (cancelErr) {
            this.logger.error(
              `Falha ao cancelar assinatura antiga ${oldSubscriptionId}: ${cancelErr.message}`,
            );
          }
        }

        const expiresAt = new Date();
        const isAnnual =
          parsed.cycle === 'annual' || payment.value > 100 || payment.value >= 154;
        if (isAnnual) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        await supabaseClient
          .from('users')
          .update({
            asaas_subscription_id: subscriptionId,
            subscription_tier: planTier,
            plan_tier: planTier,
            asaas_customer_id: customerId,
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        await supabaseClient.from('subscriptions').insert({
          user_id: user.id,
          tier: planTier,
          amount: payment.value,
          status: 'paid',
          provider: 'asaas',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        });

        this.logger.log(`Updated user ${user.id} to plan ${planTier}.`);

        try {
          const promptKey = `welcome_${planTier}`;
          const { data: promptData } = await supabaseClient
            .from('ai_prompts')
            .select('content')
            .eq('key', promptKey)
            .eq('is_active', true)
            .single();

          const welcomeMsg =
            promptData?.content ||
            (planTier === 'premium'
              ? '🌟 *Sua assinatura Premium foi confirmada com sucesso!* Seja muito bem-vindo!'
              : '🎉 *Sua assinatura Básica foi confirmada com sucesso!* Seja muito bem-vindo!');

          const targetChatId = user.wa_chatid || `${user.phone}@s.whatsapp.net`;
          await this.uazapi.sendMessage(targetChatId, welcomeMsg);
        } catch (msgErr) {
          this.logger.error(
            `Error sending welcome message to user ${user.id}: ${msgErr.message}`,
          );
        }
      } else {
        this.logger.warn(`User not found for asaas_customer_id: ${customerId}`);
      }
    }

    if (event.event === 'SUBSCRIPTION_DELETED' || event.event === 'SUBSCRIPTION_CANCELED') {
      const subscriptionId = event.payment?.subscription || event.subscription?.id;
      if (!subscriptionId) return { received: true };

      await this.supabase
        .getClient()
        .from('users')
        .update({
          subscription_tier: 'free',
          plan_tier: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('asaas_subscription_id', subscriptionId);

      this.logger.log(`Downgraded subscription ${subscriptionId} to free`);
    }

    return { received: true };
  }

  async syncSubscriptions(): Promise<{ synced: number }> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY not set. Sync skipped.');
      return { synced: 0 };
    }

    try {
      this.logger.log('Iniciando sincronização de assinaturas com o Asaas...');
      const response = await this.request('/subscriptions?status=ACTIVE&limit=100', 'GET');
      const activeSubs = response.data || [];
      this.logger.log(`Obtidas ${activeSubs.length} assinaturas ativas do Asaas.`);

      let syncedCount = 0;
      const supabaseClient = this.supabase.getClient();

      for (const sub of activeSubs) {
        const customerId = sub.customer;
        const subscriptionId = sub.id;
        const value = sub.value;
        const nextDueDate = sub.nextDueDate;

        let planTier = 'basic';
        if (value >= 29.9 || sub.description?.toLowerCase().includes('premium')) {
          planTier = 'premium';
        }

        const expiresAt = new Date(nextDueDate);
        expiresAt.setDate(expiresAt.getDate() + 1);

        const { data: dbUser } = await supabaseClient
          .from('users')
          .select('id, subscription_tier')
          .eq('asaas_customer_id', customerId)
          .maybeSingle();
        let user: any = dbUser;

        // Se não encontrou por asaas_customer_id, tenta buscar pelo telefone do cliente no Asaas
        if (!user) {
          try {
            const customer = await this.request(`/customers/${customerId}`, 'GET');
            const customerPhone = this.normalizePhone(customer.mobilePhone || customer.phone || '');
            if (customerPhone) {
              const { data: matchedUser } = await supabaseClient
                .rpc('find_user_by_normalized_phone', { phone_query: customerPhone })
                .maybeSingle() as any;
              
              if (matchedUser) {
                user = matchedUser;
                // Vincula imediatamente o asaas_customer_id no nosso banco
                await supabaseClient
                  .from('users')
                  .update({ asaas_customer_id: customerId })
                  .eq('id', user.id);
                this.logger.log(`Vinculado cliente Asaas ${customerId} ao usuário ${user.id} pelo telefone.`);
              }
            }
          } catch (custErr) {
            this.logger.warn(`Erro ao buscar dados do cliente ${customerId} para vincular por telefone: ${custErr.message}`);
          }
        }

        if (user) {
          await supabaseClient
            .from('users')
            .update({
              asaas_subscription_id: subscriptionId,
              subscription_tier: planTier,
              plan_tier: planTier,
              subscription_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          const { data: existingSub } = await supabaseClient
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('tier', planTier)
            .eq('status', 'paid')
            .maybeSingle();

          if (!existingSub) {
            await supabaseClient.from('subscriptions').insert({
              user_id: user.id,
              tier: planTier,
              amount: value,
              status: 'paid',
              provider: 'asaas',
              expires_at: expiresAt.toISOString(),
              created_at: new Date().toISOString(),
            });
          }

          syncedCount++;
        }
      }

      this.logger.log(`Sincronização concluída. ${syncedCount} usuários atualizados.`);
      return { synced: syncedCount };
    } catch (error) {
      this.logger.error(`Erro ao sincronizar com Asaas: ${error.message}`);
      throw error;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    payload: { value: number; cycle: string; description: string },
  ): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY not set. Skipping update in sandbox.');
      return { id: subscriptionId, ...payload };
    }

    try {
      this.logger.log(`Updating subscription ${subscriptionId} in Asaas...`);
      const result = await this.request(`/subscriptions/${subscriptionId}`, 'POST', {
        value: payload.value,
        cycle: payload.cycle,
        description: payload.description,
      });
      this.logger.log(`Subscription ${subscriptionId} updated successfully in Asaas.`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating subscription ${subscriptionId} in Asaas: ${error.message}`,
      );
      throw error;
    }
  }
}
