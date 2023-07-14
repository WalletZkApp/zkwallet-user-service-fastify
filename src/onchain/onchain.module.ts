import { Module } from '@nestjs/common';
import { OnchainService } from './onchain.service';
import { OnchainController } from './onchain.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [OnchainService],
  controllers: [OnchainController],
})
export class OnchainModule {}
