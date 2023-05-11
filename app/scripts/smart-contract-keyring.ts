import { TypedTransaction } from '@ethereumjs/tx';
import {
  bufferToHex,
  ecsign,
  isValidPrivate,
  privateToPublic,
  publicToAddress,
  stripHexPrefix,
  toBuffer,
} from '@ethereumjs/util';
import {
  concatSig,
  decrypt,
  getEncryptionPublicKey,
  normalize,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import { add0x, Eip1024EncryptedData, Hex, Keyring } from '@metamask/utils';
import { ethers } from 'ethers';
import { hexConcat, hexZeroPad, hexlify } from 'ethers/lib/utils';
import entryPointAbi from './EntryPoint.json';
import accountAbstractionAbi from './AccountAbstraction.json';
import {
  UserOperation,
  fillAndSign,
  fillUserOpDefaults,
  getUserOpHash,
} from './smart-contract-keyring-helper';

type KeyringOpt = {
  withAppKeyOrigin?: string;
  version?: SignTypedDataVersion | string;
};

const TYPE = 'Account Abstraction';

export default class SmartContractKeyring implements Keyring<string[]> {
  #wallets: { privateKey: Buffer; scAddress: string }[];

  readonly type: string = TYPE;

  static type: string = TYPE;

  constructor(privateKeys: string[] = []) {
    this.#wallets = [];
    console.log('constructor', privateKeys);

    /* istanbul ignore next: It's not possible to write a unit test for this, because a constructor isn't allowed
     * to be async. Jest can't await the constructor, and when the error gets thrown, Jest can't catch it. */
    this.deserialize(privateKeys).catch((error: Error) => {
      throw new Error(`Problem deserializing SimpleKeyring ${error.message}`);
    });
  }

  async serialize() {
    return this.#wallets.map(
      (wallet) => `${wallet.privateKey.toString('hex')}:${wallet.scAddress}`,
    );
  }

  async deserialize(privateKeys: string[]) {
    this.#wallets = privateKeys.map((account) => {
      const [hexPrivateKey, scAddress] = account.trim().split(':');
      const privateKey = Buffer.from(hexPrivateKey, 'hex');
      return { privateKey, scAddress };
    });
  }

  async addAccounts(numAccounts = 1) {
    throw new Error('Method "addAccounts" is not supported');
  }

  async getAccounts() {
    return this.#wallets.map((wallet) => add0x(wallet.scAddress));
  }

  async signTransaction(
    address: Hex,
    transaction: TypedTransaction,
    opts: KeyringOpt = {},
  ): Promise<UserOperation> {
    console.log('in sign transaction method');
    const privKey = this.#getPrivateKeyFor(address, opts);
    console.log(privKey ? 'Found private key' : 'Did not find private key');
    const aaAddress = this.#wallets.find(
      (wallet) => wallet.privateKey.toString('hex') === privKey.toString('hex'),
    )?.scAddress;

    console.log('address', aaAddress);

    const provider = new ethers.providers.JsonRpcProvider(
      'https://polygon-mumbai.infura.io/v3/{apiKey}',
      // `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    );

    const chainId = await provider.getNetwork().then((net) => net.chainId);
    console.log('chainId', chainId);

    const signer = new ethers.Wallet(privKey, provider);
    const entryPoint = new ethers.Contract(
      '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      // process.env.ENTRYPOINT_ADDRESS!,
      entryPointAbi.abi,
      provider,
    );
    const accountAbstractionInstance = new ethers.Contract(
      aaAddress!,
      accountAbstractionAbi.abi,
      signer,
    );

    // console.log('nonce', await accountAbstractionInstance.getNonce());

    console.log('nonce', await accountAbstractionInstance.nonce());

    console.log('before fillAndSign');
    console.log(transaction);
    const userOp = await fillAndSign(
      fillUserOpDefaults({
        sender: address,
        callData: accountAbstractionInstance.interface.encodeFunctionData(
          'execute',
          [
            transaction.to
              ? bufferToHex(transaction.to)
              : ethers.constants.AddressZero,
            transaction.value,
            transaction.data ? bufferToHex(transaction.data) : '0x',
          ],
        ),
        paymasterAndData: opts.usePaymaster
          ? hexConcat([
              '0x1Fc92037a8236AfFB3328cbEf71dd986c4a373dD',
              // process.env.PAYMASTER_ADDRESS!,
              hexZeroPad('0x3de9210F3D577272Cdb8404Cd5276C4B5dBC5b91', 32),
              // hexZeroPad(process.env.ACTION_TOKEN_ADDRESS!, 32),
              hexZeroPad(hexlify(1), 32),
            ])
          : '0x',
        nonce: (await accountAbstractionInstance.nonce()).toHexString(),
        callGasLimit: hexlify(2000000),
        verificationGasLimit: hexlify(1000000),
        maxFeePerGas: hexlify(3e9),
      }),
      signer,
      entryPoint,
    );

    const userOpHash = getUserOpHash(
      userOp,
      '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      // process.env.ENTRYPOINT_ADDRESS,
      chainId,
    );

    console.log('finished signing transaction');
    console.log(userOp, userOpHash);

    return { ...transaction, userOp, userOpHash };

    // const signedTx = transaction.sign(privKey);
    // Newer versions of Ethereumjs-tx are immutable and return a new tx object
    // return signedTx === undefined ? transaction : signedTx;
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage(
    address: Hex,
    data: string,
    opts = { withAppKeyOrigin: '' },
  ) {
    const message = stripHexPrefix(data);
    const privKey = this.#getPrivateKeyFor(address, opts);
    const msgSig = ecsign(Buffer.from(message, 'hex'), privKey);
    const rawMsgSig = concatSig(toBuffer(msgSig.v), msgSig.r, msgSig.s);
    return rawMsgSig;
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(
    address: Hex,
    msgHex: Hex,
    opts = { withAppKeyOrigin: '' },
  ) {
    const privKey = this.#getPrivateKeyFor(address, opts);
    return personalSign({ privateKey: privKey, data: msgHex });
  }

  // For eth_decryptMessage:
  async decryptMessage(withAccount: Hex, encryptedData: Eip1024EncryptedData) {
    const wallet = this.#getWalletForAccount(withAccount);
    const privateKey = wallet.privateKey.toString('hex');
    return decrypt({ privateKey, encryptedData });
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData(
    address: Hex,
    typedData: any,
    opts: KeyringOpt = { version: SignTypedDataVersion.V1 },
  ) {
    // Treat invalid versions as "V1"
    let version = SignTypedDataVersion.V1;

    if (opts.version && isSignTypedDataVersion(opts.version)) {
      version = SignTypedDataVersion[opts.version];
    }

    const privateKey = this.#getPrivateKeyFor(address, opts);
    return signTypedData({ privateKey, data: typedData, version });
  }

  // get public key for nacl
  async getEncryptionPublicKey(withAccount: Hex, opts?: KeyringOpt) {
    const privKey = this.#getPrivateKeyFor(withAccount, opts);
    const publicKey = getEncryptionPublicKey(privKey.toString('hex'));
    return publicKey;
  }

  #getPrivateKeyFor(address: Hex, opts?: KeyringOpt) {
    console.log('In "getPrivateKeyFor"');
    if (!address) {
      console.log('No address was provided');
      throw new Error('Must specify address.');
    }
    console.log('Going to get wallet');
    const wallet = this.#getWalletForAccount(address, opts);
    console.log('Found wallet:', wallet);
    return wallet.privateKey;
  }

  // returns an address specific to an app
  async getAppKeyAddress(address: Hex, origin: string) {
    if (!origin || typeof origin !== 'string') {
      throw new Error(`'origin' must be a non-empty string`);
    }
    const wallet = this.#getWalletForAccount(address, {
      withAppKeyOrigin: origin,
    });
    const appKeyAddress = add0x(bufferToHex(publicToAddress(wallet.scAddress)));
    return appKeyAddress;
  }

  // exportAccount should return a hex-encoded private key:
  async exportAccount(address: Hex, opts = { withAppKeyOrigin: '' }) {
    const wallet = this.#getWalletForAccount(address, opts);
    return wallet?.privateKey.toString('hex');
  }

  removeAccount(address: string) {
    if (!this.#getWalletForAccount(address)) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.#wallets = this.#wallets.filter(
      ({ scAddress }) => scAddress.toLowerCase() !== address.toLowerCase(),
    );
  }

  #getWalletForAccount(account: string | number, opts?: KeyringOpt) {
    const address = normalize(account);
    const wallet = this.#wallets.find(
      ({ scAddress }) =>
        scAddress.toLowerCase() === address?.toLocaleLowerCase(),
    );

    if (!wallet) {
      console.log('No wallet found for:', address);
      throw new Error('Simple Keyring - Unable to find matching address.');
    }

    if (opts?.withAppKeyOrigin) {
      console.log('withAppKeyOrigin is present');
      throw new Error('App key is not supported');
    }

    return wallet;
  }
}

/**
 * Type predicate type guard to check if a string is in the enum SignTypedDataVersion.
 *
 * @param version - The string to check.
 * @returns Whether it's in the enum.
 */
// TODO: Put this in @metamask/eth-sig-util
function isSignTypedDataVersion(
  version: SignTypedDataVersion | string,
): version is SignTypedDataVersion {
  return version in SignTypedDataVersion;
}
