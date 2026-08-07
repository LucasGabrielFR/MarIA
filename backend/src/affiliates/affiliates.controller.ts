import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { AffiliatesService, Affiliate, AffiliatePromotion } from './affiliates.service';

@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get()
  async getAll() {
    return this.affiliatesService.getAllAffiliates();
  }

  @Get('by-admin/:adminId')
  async getByAdminId(@Param('adminId') adminId: string) {
    const affiliates = await this.affiliatesService.getAllAffiliates();
    const affiliate = affiliates.find(a => a.admin_id === adminId);
    if (!affiliate) {
      return { success: false, message: 'Affiliate not found for this admin' };
    }
    return { success: true, affiliate };
  }

  @Get('code/:code')
  async getByCode(@Param('code') code: string) {
    const affiliate = await this.affiliatesService.getAffiliateByCode(code);
    if (!affiliate) {
      return { success: false, message: 'Affiliate not found' };
    }
    return { success: true, affiliate };
  }

  @Post()
  async create(@Body() affiliate: Partial<Affiliate>) {
    return this.affiliatesService.createAffiliate(affiliate);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<Affiliate>) {
    return this.affiliatesService.updateAffiliate(id, updates);
  }

  @Get(':id/promotions')
  async getPromotions(@Param('id') id: string) {
    return this.affiliatesService.getPromotionsByAffiliate(id);
  }

  @Post(':id/promotions')
  async setPromotion(@Param('id') id: string, @Body() promotion: Partial<AffiliatePromotion>) {
    return this.affiliatesService.setPromotion({
      ...promotion,
      affiliate_id: id,
    });
  }

  // Helper endpoint para buscar qual o preço de um plano dado o código de um afiliado (usado no frontend)
  @Get('code/:code/plan/:tier/:cycle')
  async getAffiliatePlanPrice(
    @Param('code') code: string,
    @Param('tier') tier: string,
    @Param('cycle') cycle: string,
  ) {
    const affiliate = await this.affiliatesService.getAffiliateByCode(code);
    if (!affiliate || !affiliate.is_active) {
      return { success: false, message: 'Affiliate not found or inactive' };
    }

    const promotion = await this.affiliatesService.getPromotionForAffiliateAndPlan(affiliate.id, tier, cycle);
    if (!promotion || !promotion.is_active) {
      return { success: false, message: 'Promotion not found or inactive' };
    }

    return {
      success: true,
      discount_percentage: promotion.discount_percentage,
    };
  }

  @Get('code/:code/promotions')
  async getPromotionsByCode(@Param('code') code: string) {
    const affiliate = await this.affiliatesService.getAffiliateByCode(code);
    if (!affiliate || !affiliate.is_active) {
      return { success: false, message: 'Affiliate not found or inactive' };
    }
    const promotions = await this.affiliatesService.getPromotionsByAffiliate(affiliate.id);
    return { success: true, promotions: promotions.filter(p => p.is_active) };
  }

  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    return this.affiliatesService.getDashboardStats(id);
  }

  @Get(':id/insights')
  async getInsights(@Param('id') id: string) {
    return this.affiliatesService.getAffiliateInsights(id);
  }
}
