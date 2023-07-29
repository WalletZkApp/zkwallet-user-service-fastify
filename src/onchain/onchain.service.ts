import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import bs58check from 'bs58check';
import Client from 'mina-signer';
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

  constructor(
    private configService: ConfigService<AllConfigType>,
    private usersService: UsersService,
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
    // check if amount is > 0
    if (amount <= 0) {
      return false;
    }

    //check if receiver is a valid account
    const accountExists = await this.usersService.isExistByWalletAddress(
      receiver,
    );
    if (!accountExists) {
      console.log('Account does not exist: ', receiver);
      return false;
    }

    console.log(`Sending ${amount} Mina to ${receiver}`);
    const receiverPublicKey: PublicKey = PublicKey.fromBase58(receiver);

    const transactionFee = 100_000_000;

    const accountIsNew: boolean = await this.accountIsNew(receiver);

    const tx = await Mina.transaction(
      { sender: this.publicKey, fee: transactionFee },
      () => {
        let accountUpdate: AccountUpdate;
        if (accountIsNew) {
          accountUpdate = AccountUpdate.fundNewAccount(this.publicKey, 3);
        } else {
          accountUpdate = AccountUpdate.createSigned(this.publicKey);
        }
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

  // ref: https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/background/accountService.js#L42
  async createNewWallet(): Promise<{
    priKey: string;
    pubKey: string;
    hdIndex: number;
  }> {
    const seed = bip39.generateMnemonic();
    const bufferSeed = bip39.mnemonicToSeedSync(seed);
    const masterNode = bip32.fromSeed(bufferSeed);
    let hdPath = this.getHDpath(0);
    const child0 = masterNode.derivePath(hdPath) as any;
    child0.privateKey[0] &= 0x3f;
    const childPrivateKey = this.reverse(child0.privateKey);
    const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`;
    const privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'));
    const client = new Client({ network: 'mainnet' });
    const publicKey = client.derivePublicKey(privateKey);
    return {
      priKey: privateKey,
      pubKey: publicKey,
      hdIndex: 0,
    };
  }

  // ref: https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/background/accountService.js#L13
  private getHDpath(account = 0) {
    let purpse = 44;
    let index = 0;
    let charge = 0;
    let hdpath =
      'm/' +
      purpse +
      "'/" +
      12586 +
      "'/" +
      account +
      "'/" +
      charge +
      '/' +
      index;
    return hdpath;
  }
  // ref: https://github.com/aurowallet/auro-wallet-browser-extension/blob/3a5fe2b5370bbf18293cb7de48b33bb96b7b4730/src/background/accountService.js#L35
  private reverse(bytes) {
    const reversed = new Buffer(bytes.length);
    for (let i = bytes.length; i > 0; i--) {
      reversed[bytes.length - i] = bytes[i - 1];
    }
    return reversed;
  }
}
