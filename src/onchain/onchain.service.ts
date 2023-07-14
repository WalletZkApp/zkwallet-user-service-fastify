import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

import {
  AccountUpdate,
  Mina,
  PublicKey,
  PrivateKey,
  fetchAccount,
} from 'snarkyjs';
import { AllConfigType } from 'src/config/config.type';
import { map } from 'rxjs';

@Injectable()
export class OnchainService {
  private privateKey: PrivateKey;
  private publicKey: PublicKey;

  constructor(
    private http: HttpService,
    private configService: ConfigService<AllConfigType>,
  ) {
    const privateKeyFromConf: string = configService.get(
      'topup.minaPrivateKey',
      {
        infer: true,
      },
    ) as string;
    const berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql',
    );
    Mina.setActiveInstance(berkeley);

    this.privateKey = PrivateKey.fromBase58(privateKeyFromConf);
    this.publicKey = this.privateKey.toPublicKey();
  }

  async getBalance(account: string): Promise<string> {
    const accountPublicKey: PublicKey = PublicKey.fromBase58(account);
    const response = await fetchAccount({ publicKey: accountPublicKey });
    if (response.error) {
      console.log('Error fetching account: ', response.error.statusText);
    }
    if (response.account) {
      return response.account.balance.toString();
    } else {
      return '0';
    }
  }

  async accountIsNew(account: string): Promise<boolean> {
    const accountPublicKey: PublicKey = PublicKey.fromBase58(account);
    const response = await fetchAccount({ publicKey: accountPublicKey });
    if (response.error) {
      return true;
    } else {
      return false;
    }
  }

  async sendMina(receiver: string, amount: number): Promise<boolean> {
    console.log(`Sending ${amount} Mina to ${receiver}`);
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(receiver);

    const transactionFee = 100_000_000;

    const accountIsNew: boolean = await this.accountIsNew(receiver);
    if (accountIsNew) {
      // TODO: This is only available on testnet
      this.getMinaFromFaucet(receiver);
      return true;
    } else {
      const tx = await Mina.transaction(
        { sender: this.publicKey, fee: transactionFee },
        () => {
          const accountUpdate: AccountUpdate = AccountUpdate.createSigned(
            this.publicKey,
          );
          accountUpdate.send({ to: receiverPublicKey, amount: 1e9 * amount });
        },
      );
      // fill in the proof - this can take a while...
      console.log('Creating an execution proof...');
      await tx.prove();

      // send the transaction to the graphql endpoint
      console.log('Sending the transaction...');
      await tx.sign([this.privateKey]).send();

      return true;
    }
  }

  // write a function that do http request to faucet (https://faucet.minaprotocol.com/?address=account)
  // and return true if success
  getMinaFromFaucet(account: string) {
    return this.http
      .get(`https://faucet.minaprotocol.com/?address=${account}`)
      .pipe(map((response) => console.log(response.data)));
  }
}
