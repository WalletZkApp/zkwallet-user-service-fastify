import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { RolesGuard } from 'src/roles/roles.guard';
import { OnchainService } from './onchain.service';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('OnChain')
@Controller({
  path: 'onchain',
  version: '1',
})
export class OnchainController {
  constructor(private onchainService: OnchainService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendMina(@Body() body: any) {
    await this.onchainService.sendMina(body.to, body.amount);
  }
}
