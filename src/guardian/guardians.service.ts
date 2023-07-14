import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { DeepPartial, Repository } from 'typeorm';
import crypto from 'crypto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { EntityCondition } from 'src/utils/types/entity-condition.type';
import { NullableType } from 'src/utils/types/nullable.type';
import { Guardian } from './entities/guardian.entity';
import { CreateGuardianDto } from './dto/guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(
    @InjectRepository(Guardian)
    private readonly guardiansRepository: Repository<Guardian>,
  ) {}

  create(createGuardianInput: CreateGuardianDto): Promise<Guardian> {
    return this.guardiansRepository.save(
      this.guardiansRepository.create(createGuardianInput),
    );
  }

  findManyWithPagination(
    paginationOptions: IPaginationOptions,
  ): Promise<Guardian[]> {
    return this.guardiansRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });
  }

  findOne(fields: EntityCondition<Guardian>): Promise<NullableType<Guardian>> {
    return this.guardiansRepository.findOne({
      where: fields,
    });
  }

  update(
    id: Guardian['id'],
    payload: DeepPartial<Guardian>,
  ): Promise<Guardian> {
    return this.guardiansRepository.save(
      this.guardiansRepository.create({
        id,
        ...payload,
      }),
    );
  }

  async softDelete(id: Guardian['id']): Promise<void> {
    await this.guardiansRepository.softDelete(id);
  }
}
