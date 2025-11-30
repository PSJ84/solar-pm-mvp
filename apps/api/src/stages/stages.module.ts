// apps/api/src/stages/stages.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';

@Module({
  imports: [PrismaModule],
  providers: [StagesService],
  controllers: [StagesController],
})
export class StagesModule {}
