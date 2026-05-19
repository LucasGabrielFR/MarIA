import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiKey = process.env.ASAAS_API_KEY || '';
  private readonly apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  constructor(private readonly supabase: SupabaseService) {}

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
         value = 14.90;
         cycleAsaas = 'MONTHLY';
         description = 'Plano Básico (Mensal)';
      }
    } else if (planId === 'premium') {
      if (cycle === 'annual') {
         value = 322.80; // R$ 26,90 * 12
         cycleAsaas = 'YEARLY';
         description = 'Plano Premium (Anual)';
      } else {
         value = 29.90;
         cycleAsaas = 'MONTHLY';
         description = 'Plano Premium (Mensal)';
      }
    } else {
      throw new BadRequestException('Plano inválido');
    }

    // 1. Check or create Customer in Asaas based on phone
    // For simplicity in this example, we create a new customer or fetch by phone
    // Using Supabase to map phone -> asaas_customer_id
    const { data: user } = await this.supabase.getClient()
      .from('users')
      .select('id, asaas_customer_id')
      .eq('phone_number', phone)
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

       // Link if user exists, otherwise it will be linked on payment confirm webhook
       if (user) {
          await this.supabase.getClient()
             .from('users')
             .update({ asaas_customer_id: asaasCustomerId })
             .eq('id', user.id);
       }
    }

    // 2. Create Subscription in Asaas
    // Note: To force Credit Card, we set billingType: 'CREDIT_CARD'.
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
    // When a subscription is created, a charge (payment) is also generated for the first cycle.
    // We fetch the first payment for this subscription to get the invoiceUrl.
    const payments = await this.request(`/payments?subscription=${subscription.id}&status=PENDING`, 'GET');
    
    if (payments.data && payments.data.length > 0) {
       return { url: payments.data[0].invoiceUrl };
    }

    // Fallback if no payment was immediately found
    throw new Error('Não foi possível gerar a URL de pagamento. Tente novamente.');
  }

  async handleWebhook(event: any) {
    this.logger.log(`Received Asaas Webhook: ${event.event}`);

    // Asaas sends "PAYMENT_CONFIRMED" when a charge is paid
    if (event.event === 'PAYMENT_CONFIRMED') {
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
       
       let userQuery = supabaseClient.from('users').select('id').eq('asaas_customer_id', customerId).single();
       let { data: user } = await userQuery;

       if (!user && phone) {
           // Fallback to phone mapping
           const { data: phoneUser } = await supabaseClient.from('users').select('id').eq('phone_number', phone).single();
           user = phoneUser;
       }

       if (user) {
          await supabaseClient.from('users').update({
             asaas_subscription_id: subscriptionId,
             plan_tier: planTier,
             asaas_customer_id: customerId,
          }).eq('id', user.id);
          this.logger.log(`Updated user ${user.id} to plan ${planTier}`);
       } else {
          this.logger.warn(`User not found for asaas_customer_id: ${customerId}`);
       }
    }

    if (event.event === 'SUBSCRIPTION_DELETED' || event.event === 'SUBSCRIPTION_CANCELED') {
       const subscriptionId = event.payment?.subscription || event.subscription?.id;
       if (!subscriptionId) return { received: true };

       await this.supabase.getClient().from('users').update({
          plan_tier: 'free',
       }).eq('asaas_subscription_id', subscriptionId);
       this.logger.log(`Downgraded subscription ${subscriptionId} to free`);
    }

    return { received: true };
  }
}
