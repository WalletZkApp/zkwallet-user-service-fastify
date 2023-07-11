import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountUpdate,
  Mina,
  PublicKey,
  PrivateKey,
  fetchAccount,
} from 'snarkyjs';
import { AllConfigType } from 'src/config/config.type';

@Injectable()
export class OnchainService {
  private privateKey: PrivateKey;
  private publicKey: PublicKey;

  constructor(private configService: ConfigService<AllConfigType>) {
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

  async sendMina(receiver: string, amount: number): Promise<boolean> {
    console.log(`Sending ${amount} Mina to ${receiver}`);
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(receiver);

    const response = await fetchAccount({ publicKey: this.publicKey });
    if (response.error) throw Error(response.error.statusText);
    const { nonce, balance } = response.account;
    console.log(
      `Using fee payer account with nonce ${nonce}, balance ${balance}`,
    );

    const tx = await Mina.transaction(this.publicKey, () => {
      const accountUpdate = AccountUpdate.fundNewAccount(this.publicKey);
      accountUpdate.send({ to: receiverPublicKey, amount: 1e9 * amount });
    });
    await tx.sign([this.privateKey]).send();
    console.log(
      `account1 balance: ${Mina.getBalance(this.publicKey).div(1e9)} MINA`,
    );

    console.log(
      `account2 balance: ${Mina.getBalance(receiverPublicKey).div(1e9)} MINA\n`,
    );

    return true;
  }
}
