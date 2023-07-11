import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guardian } from 'src/guardian/entities/guardian.entity';
import { GuardianSeedService } from './guardian-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Guardian])],
  providers: [GuardianSeedService],
  exports: [GuardianSeedService],
})
export class GuardianSeedModule {}
