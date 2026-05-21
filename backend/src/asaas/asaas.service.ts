import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UazapiService } from '../uazapi/uazapi.service';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiKey = process.env.ASAAS_API_KEY || '';
  private readonly apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  constructor(
    private readonly supabase: SupabaseService,
    private readonly uazapi: UazapiService,
  ) {}

  private async request(endpoint: string, method: string, data?: any) {
    const url = `${this.apiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
      },
      ...(data && { body: JSON.stringify(data) }),
    };

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      this.logger.error(`Asaas API error: ${JSON.stringify(result)}`);
      throw new Error(result?.errors?.[0]?.description || 'Erro na integração com Asaas');
    }

    return result;
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
      this.logger.error(`Error cancelling subscription ${subscriptionId} in Asaas: ${error.message}`);
      throw error;
    }
  }

  async createCheckoutUrl(planId: string, cycle: string, phone: string): Promise<{ url: string }> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY not set. Returning a dummy URL for testing.');
      return { url: 'https://sandbox.asaas.com/checkout/dummy' };
    }

    // Determine value and cycle mapping
    let value = 0;
    let cycleAsaas = 'MONTHLY';
    let description = '';

    if (planId === 'basic') {
      if (cycle === 'annual') {
         value = 154.80; // R$ 12,90 * 12
         cycleAsaas = 'YEARLY';
         description = 'Plano Básico (Anual)';
      } else {
         value = 14.99; // Plano básico mensal - R$14,99
         cycleAsaas = 'MONTHLY';
         description = 'Plano Básico (Mensal)';
      }
    } else if (planId === 'premium') {
      if (cycle === 'annual') {
         value = 322.80; // R$ 26,90 * 12
         cycleAsaas = 'YEARLY';
         description = 'Plano Premium (Anual)';
      } else {
         value = 29.90; // Plano Premium mensal - R$29,90
         cycleAsaas = 'MONTHLY';
         description = 'Plano Premium (Mensal)';
      }
    } else {
      throw new BadRequestException('Plano inválido');
    }

    // 1. Check or create Customer in Asaas based on phone
    const { data: user } = await this.supabase.getClient()
      .from('users')
      .select('id, asaas_customer_id')
      .eq('phone', phone)
      .single();

    let asaasCustomerId = user?.asaas_customer_id;

    if (!asaasCustomerId) {
       // Create Customer in Asaas
       const customerPayload = {
         name: `Cliente WhatsApp ${phone}`,
         mobilePhone: phone,
       };
       const customer = await this.request('/customers', 'POST', customerPayload);
       asaasCustomerId = customer.id;

       // Link if user exists
       if (user) {
          await this.supabase.getClient()
             .from('users')
             .update({ asaas_customer_id: asaasCustomerId })
             .eq('id', user.id);
       }
    }

    // 2. Create Subscription in Asaas
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1); // Starting tomorrow or today

    const subscriptionPayload = {
       customer: asaasCustomerId,
       billingType: 'CREDIT_CARD',
       value: value,
       nextDueDate: nextDueDate.toISOString().split('T')[0],
       cycle: cycleAsaas,
       description: description,
       externalReference: `${planId}_${phone}`, // To identify on webhook
    };

    const subscription = await this.request('/subscriptions', 'POST', subscriptionPayload);

    // 3. To get a checkout URL, Asaas usually provides `invoiceUrl` in the charge.
    const payments = await this.request(`/payments?subscription=${subscription.id}&status=PENDING`, 'GET');
    
    if (payments.data && payments.data.length > 0) {
       return { url: payments.data[0].invoiceUrl };
    }

    // Fallback if no payment was immediately found
    throw new Error('Não foi possível gerar a URL de pagamento. Tente novamente.');
  }

  async handleWebhook(event: any) {
    this.logger.log(`Received Asaas Webhook: ${event.event}`);

    // Asaas sends "PAYMENT_CONFIRMED" or "PAYMENT_RECEIVED" when a charge is paid
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
       const payment = event.payment;
       const subscriptionId = payment.subscription;
       const customerId = payment.customer;
       const externalReference = payment.externalReference; // "basic_5511999999999"
       
       if (!subscriptionId) return { received: true };

       let planTier = 'basic';
       let phone = null;

       if (externalReference) {
          const parts = externalReference.split('_');
          if (parts.length >= 2) {
             planTier = parts[0];
             phone = parts[1];
          }
       } else {
         // Try to deduce plan from value
         if (payment.value >= 29.90) planTier = 'premium';
         else planTier = 'basic';
       }

       // Update Supabase
       const supabaseClient = this.supabase.getClient();
       
       let userQuery = supabaseClient.from('users').select('*').eq('asaas_customer_id', customerId).single();
       let { data: user } = await userQuery;

       if (!user && phone) {
            // Fallback to phone mapping
            const { data: phoneUser } = await supabaseClient.from('users').select('*').eq('phone', phone).single();
            user = phoneUser;
       }

       if (user) {
          const oldSubscriptionId = user.asaas_subscription_id;

          // Prevent Double Billing / Upgrade Cancellation:
          // If user had an active subscription in Asaas and it is different from this new one, cancel it.
          if (oldSubscriptionId && oldSubscriptionId !== subscriptionId) {
             this.logger.log(`Detectando upgrade/mudança de plano para o usuário ${user.id}. Cancelando assinatura antiga ${oldSubscriptionId}...`);
             try {
                await this.cancelSubscription(oldSubscriptionId);
             } catch (cancelErr) {
                this.logger.error(`Falha ao cancelar assinatura antiga ${oldSubscriptionId}: ${cancelErr.message}`);
             }
          }

          // Calculate next expiration date
          const expiresAt = new Date();
          if (payment.value > 100) {
             expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Annual plan
          } else {
             expiresAt.setMonth(expiresAt.getMonth() + 1); // Monthly plan
          }

          // Update user columns
          await supabaseClient.from('users').update({
             asaas_subscription_id: subscriptionId,
             subscription_tier: planTier,
             plan_tier: planTier,
             asaas_customer_id: customerId,
             subscription_expires_at: expiresAt.toISOString(),
             updated_at: new Date().toISOString()
          }).eq('id', user.id);

          // Insert record in subscriptions table
          await supabaseClient.from('subscriptions').insert({
             user_id: user.id,
             tier: planTier,
             amount: payment.value,
             status: 'paid',
             provider: 'asaas',
             expires_at: expiresAt.toISOString(),
             created_at: new Date().toISOString()
          });

          this.logger.log(`Updated user ${user.id} to plan ${planTier} and recorded subscription.`);

          // Send welcome message via WhatsApp
          try {
             const promptKey = `welcome_${planTier}`;
             const { data: promptData } = await supabaseClient
                .from('ai_prompts')
                .select('content')
                .eq('key', promptKey)
                .eq('is_active', true)
                .single();

             const welcomeMsg = promptData?.content || (planTier === 'premium' 
                ? '🌟 *Sua assinatura Premium foi confirmada com sucesso!* Seja muito bem-vindo!' 
                : '🎉 *Sua assinatura Básica foi confirmada com sucesso!* Seja muito bem-vindo!');

             const targetChatId = user.wa_chatid || `${user.phone}@s.whatsapp.net`;
             await this.uazapi.sendMessage(targetChatId, welcomeMsg);
          } catch (msgErr) {
             this.logger.error(`Error sending welcome message to user ${user.id}: ${msgErr.message}`);
          }
       } else {
          this.logger.warn(`User not found for asaas_customer_id: ${customerId}`);
       }
    }

    if (event.event === 'SUBSCRIPTION_DELETED' || event.event === 'SUBSCRIPTION_CANCELED') {
       const subscriptionId = event.payment?.subscription || event.subscription?.id;
       if (!subscriptionId) return { received: true };

       await this.supabase.getClient().from('users').update({
          subscription_tier: 'free',
          plan_tier: 'free',
          updated_at: new Date().toISOString()
       }).eq('asaas_subscription_id', subscriptionId);
       
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
        if (value >= 29.90 || sub.description?.toLowerCase().includes('premium')) {
          planTier = 'premium';
        }

        const expiresAt = new Date(nextDueDate);
        expiresAt.setDate(expiresAt.getDate() + 1); // 1 day grace period

        let { data: user } = await supabaseClient
          .from('users')
          .select('id, subscription_tier')
          .eq('asaas_customer_id', customerId)
          .maybeSingle();

        if (user) {
          await supabaseClient.from('users').update({
            asaas_subscription_id: subscriptionId,
            subscription_tier: planTier,
            plan_tier: planTier,
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', user.id);

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
              created_at: new Date().toISOString()
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

  async updateSubscription(subscriptionId: string, payload: { value: number, cycle: string, description: string }): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY not set. Skipping update in sandbox.');
      return { id: subscriptionId, ...payload };
    }

    try {
      this.logger.log(`Updating subscription ${subscriptionId} in Asaas...`);
      const result = await this.request(`/subscriptions/${subscriptionId}`, 'POST', {
        value: payload.value,
        cycle: payload.cycle,
        description: payload.description
      });
      this.logger.log(`Subscription ${subscriptionId} updated successfully in Asaas.`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating subscription ${subscriptionId} in Asaas: ${error.message}`);
      throw error;
    }
  }
}
