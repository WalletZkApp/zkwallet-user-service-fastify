import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/roles/roles.guard';
import { NullableType } from 'src/utils/types/nullable.type';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto, UpdateGuardianDto } from './dto/guardian.dto';
import { Guardian } from './entities/guardian.entity';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { infinityPagination } from 'src/utils/infinity-pagination';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'guardians',
  version: '1',
})
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGuardianDto: CreateGuardianDto): Promise<Guardian> {
    return this.guardiansService.create(createGuardianDto);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResultType<Guardian>> {
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.guardiansService.findManyWithPagination({
        page,
        limit,
      }),
      { page, limit },
    );
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<NullableType<Guardian>> {
    return this.guardiansService.findOne({ id });
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateGuardianDto: UpdateGuardianDto,
  ): Promise<Guardian> {
    return this.guardiansService.update(id, updateGuardianDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.guardiansService.softDelete(id);
  }
}
