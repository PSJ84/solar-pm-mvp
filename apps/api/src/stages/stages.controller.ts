// apps/api/src/stages/stages.controller.ts
import { Controller, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StagesService } from './stages.service';
import { UpdateStageDatesDto } from './dto/update-stage-dates.dto';
import { UpdateStageActiveDto } from './dto/update-stage-active.dto';

@ApiTags('Stages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Patch(':id/dates')
  @ApiOperation({ summary: '프로젝트 단계 일정 수정' })
  async updateDates(
    @Param('id') id: string,
    @Body() dto: UpdateStageDatesDto,
    @Req() _req: any,
  ) {
    return this.stagesService.updateDates(id, dto);
  }

  @Patch(':id/active')
  @ApiOperation({ summary: '프로젝트 단계 활성/비활성 토글' })
  async updateActive(
    @Param('id') id: string,
    @Body() dto: UpdateStageActiveDto,
  ) {
    return this.stagesService.updateActive(id, dto);
  }
}
