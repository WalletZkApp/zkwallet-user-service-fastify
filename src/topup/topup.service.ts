import { Injectable } from '@nestjs/common';
import { OnchainService } from 'src/onchain/onchain.service';
@Injectable()
export class TopupService {
  constructor(private onchainService: OnchainService) {}

  topup(account: string, amount: number): Promise<boolean> {
    // as for now we are sending mina directly without payment gateway
    return this.onchainService.sendMina(account, amount);
  }
}
