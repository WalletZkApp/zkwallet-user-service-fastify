import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { TopUpDto } from './dto/topup.dto';
import { TopupService } from './topup.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles/roles.guard';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Topups')
@Controller({
  path: 'topup',
  version: '1',
})
export class TopupController {
  constructor(private topupService: TopupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  topup(@Res() response: Response, @Body() topUpDto: TopUpDto) {
    this.topupService
      .topup(topUpDto.account, topUpDto.amount)
      .then((res) => {
        response.status(HttpStatus.CREATED).json(res);
      })
      .catch((err) => {
        response.status(HttpStatus.BAD_REQUEST).json(err);
      });
  }
}
