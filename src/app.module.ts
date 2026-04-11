import { Module } from '@nestjs/common';
import { WriteupModule } from './writeup/writeup.module';

@Module({
  imports: [WriteupModule],
})
export class AppModule {}
