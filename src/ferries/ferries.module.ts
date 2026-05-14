import { Module } from '@nestjs/common';
import { FerriesService } from './ferries.service';
import { FerriesController } from './ferries.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],  // This imports JwtAuthGuard and RolesGuard
  controllers: [FerriesController],
  providers: [FerriesService, PrismaService],
  exports: [FerriesService],
})
export class FerriesModule {}