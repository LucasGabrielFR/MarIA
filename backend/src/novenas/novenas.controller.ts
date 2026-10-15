import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  NovenasService,
  CreateNovenaDto,
  UpdateNovenaDto,
  StartUserNovenaDto,
  CheckDayDto,
} from './novenas.service';

@Controller('panel/novenas')
export class PanelNovenasController {
  constructor(private readonly novenasService: NovenasService) {}

  @Get()
  async getAdminNovenas(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.novenasService.getAdminNovenas(search, category, status);
  }

  @Get(':id')
  async getNovenaById(@Param('id') id: string) {
    return this.novenasService.getNovenaById(id);
  }

  @Post('seed')
  async seedInitialNovenas() {
    return this.novenasService.seedDefaultNovenas();
  }

  @Post()
  async createNovena(@Body() dto: CreateNovenaDto) {
    return this.novenasService.createNovena(dto);
  }

  @Patch(':id')
  async updateNovena(@Param('id') id: string, @Body() dto: UpdateNovenaDto) {
    return this.novenasService.updateNovena(id, dto);
  }

  @Delete(':id')
  async deleteNovena(@Param('id') id: string) {
    return this.novenasService.deleteNovena(id);
  }
}

@Controller('mobile/novenas')
export class MobileNovenasController {
  constructor(private readonly novenasService: NovenasService) {}

  @Get()
  async getPublishedNovenas(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.novenasService.getPublishedNovenas(category, search);
  }

  @Get('user/:userId/active')
  async getUserActiveNovenas(@Param('userId') userId: string) {
    return this.novenasService.getUserActiveNovenas(userId);
  }

  @Get(':idOrSlug')
  async getNovenaDetails(@Param('idOrSlug') idOrSlug: string) {
    return this.novenasService.getNovenaBySlugOrId(idOrSlug);
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startUserNovena(@Body() dto: StartUserNovenaDto) {
    return this.novenasService.startUserNovena(dto);
  }

  @Post('check-day')
  @HttpCode(HttpStatus.OK)
  async checkUserNovenaDay(@Body() dto: CheckDayDto) {
    return this.novenasService.checkUserNovenaDay(dto);
  }
}
