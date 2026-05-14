import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { XenditService } from './xendit.service';

@Module({
  imports: [HttpModule],
  providers: [XenditService],
  exports: [XenditService],
})
export class XenditModule {}