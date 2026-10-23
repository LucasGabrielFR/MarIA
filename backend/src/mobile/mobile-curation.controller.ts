import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { MobileCurationService } from './mobile-curation.service';
import type {
  MobileCampaignInput,
  MobileHighlightInput,
} from './mobile-curation.service';

@Controller('panel/mobile')
export class MobileCurationAdminController {
  constructor(private readonly curationService: MobileCurationService) {}

  @Get('highlights')
  getHighlights(
    @Headers('x-admin-id') adminId: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.curationService.listAdminHighlights(adminId, authorization);
  }

  @Post('highlights')
  saveHighlight(
    @Headers('x-admin-id') adminId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: MobileHighlightInput,
  ) {
    return this.curationService.saveHighlight(adminId, authorization, body);
  }

  @Delete('highlights/:id')
  deleteHighlight(
    @Headers('x-admin-id') adminId: string,
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.curationService.deleteHighlight(adminId, authorization, id);
  }

  @Get('campaigns')
  getCampaigns(
    @Headers('x-admin-id') adminId: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.curationService.listCampaigns(adminId, authorization);
  }

  @Post('campaigns')
  createCampaign(
    @Headers('x-admin-id') adminId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: MobileCampaignInput,
  ) {
    return this.curationService.createCampaign(adminId, authorization, body);
  }
}

@Controller('mobile')
export class MobilePushController {
  constructor(private readonly curationService: MobileCurationService) {}

  @Get('highlights')
  getHighlights() {
    return this.curationService.listHighlights();
  }

  @Post('push/register')
  registerInstallation(
    @Headers('authorization') authorization: string | undefined,
    @Body('installationId') installationId: string | undefined,
    @Body('platform') platform: string,
  ) {
    return this.curationService.registerInstallation(
      authorization,
      installationId,
      platform,
    );
  }

  @Delete('push/register')
  unregisterInstallation(
    @Headers('authorization') authorization: string | undefined,
    @Body('installationId') installationId: string | undefined,
  ) {
    return this.curationService.unregisterInstallation(
      authorization,
      installationId,
    );
  }
}
