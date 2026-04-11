import { Module } from '@nestjs/common';
import { WriteupController } from './writeup.controller';
import { WriteupService } from './writeup.service';

@Module({
  controllers: [WriteupController],
  providers: [WriteupService],
})
export class WriteupModule {}
