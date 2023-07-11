import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardiansService } from './guardians.service';
import { GuardiansController } from './guardians.controller';
import { Guardian } from './entities/guardian.entity';
import { IsExist } from 'src/utils/validators/is-exists.validator';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';

@Module({
  imports: [TypeOrmModule.forFeature([Guardian])],
  providers: [IsExist, IsNotExist, GuardiansService],
  controllers: [GuardiansController],
})
export class GuardiansModule {}
