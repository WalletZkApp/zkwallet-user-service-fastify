import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { RolesGuard } from 'src/roles/roles.guard';
import { OnchainService } from './onchain.service';
import { OnChainDto, OnChainGuardianDto } from './dto/onchain.dto';
import { Guardian } from 'src/guardian/guardians';
import { Field, PublicKey } from 'snarkyjs';

@ApiTags('OnChain')
@Controller({
  path: 'onchain',
  version: '1',
})
export class OnchainController {
  constructor(private onchainService: OnchainService) {}

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('sendMina')
  @HttpCode(HttpStatus.OK)
  async sendMina(@Body() data: OnChainDto) {
    await this.onchainService.sendMina(data.publicKey, data.amount);
  }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getBalance(@Query('account') account: string) {
    return await this.onchainService.getBalance(account);
  }

  @Get('accountIsNew')
  @HttpCode(HttpStatus.OK)
  async accountIsNew(@Query('account') account: string) {
    return await this.onchainService.accountIsNew(account);
  }
}
