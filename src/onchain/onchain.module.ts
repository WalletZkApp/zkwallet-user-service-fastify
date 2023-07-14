import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from 'src/users/users.module';
import { OnchainService } from './onchain.service';
import { OnchainController } from './onchain.controller';

@Module({
  imports: [UsersModule, HttpModule],
  providers: [OnchainService],
  controllers: [OnchainController],
  exports: [OnchainService],
})
export class OnchainModule {}
