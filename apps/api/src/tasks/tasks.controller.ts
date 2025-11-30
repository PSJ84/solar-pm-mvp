// apps/api/src/tasks/tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: '태스크 생성' })
  async create(@Body() dto: CreateTaskDto, @Req() req: any) {
    const user = (req as any).user;
    return this.tasksService.create(dto, user?.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '태스크 상세 조회' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '태스크 수정' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const user = (req as any).user;
    return this.tasksService.update(id, dto, user?.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '태스크 상태 변경 + 히스토리 자동 기록 (MVP #30)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    const user = (req as any).user;
    return this.tasksService.updateStatus(id, dto, user?.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: '태스크 삭제' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = (req as any).user;
    return this.tasksService.remove(id, user?.sub);
  }
}
