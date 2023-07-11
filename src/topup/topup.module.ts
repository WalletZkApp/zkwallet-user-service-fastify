import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TopupService } from './topup.service';
import { TopupController } from './topup.controller';

@Module({
  imports: [ConfigModule],
  providers: [TopupService],
  controllers: [TopupController],
})
export class TopupModule {}
