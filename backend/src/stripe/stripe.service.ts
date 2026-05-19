import { Injectable } from '@nestjs/common';

@Injectable()
export class StripeService {
  async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    return { url: 'https://billing.stripe.com/p/session/dummy' };
  }
}
