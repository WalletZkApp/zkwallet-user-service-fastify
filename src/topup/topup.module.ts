import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OnchainModule } from 'src/onchain/onchain.module';
import { TopupService } from './topup.service';
import { TopupController } from './topup.controller';

@Module({
  imports: [ConfigModule, OnchainModule, HttpModule],
  providers: [TopupService],
  controllers: [TopupController],
})
export class TopupModule {}
