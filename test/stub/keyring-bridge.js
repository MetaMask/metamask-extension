import {
  FeeMarketEIP1559Transaction,
  LegacyTransaction,
  TransactionFactory,
} from '@ethereumjs/tx';
import {
  signTypedData,
  SignTypedDataVersion,
  personalSign,
} from '@metamask/eth-sig-util';
import {
  bigIntToHex,
  bytesToBigInt,
  bytesToHex,
  remove0x,
  add0x,
} from '@metamask/utils';
import { rlp } from 'ethereumjs-util';
import { utils as EthersUtils } from 'ethers';
import { Common } from './keyring-utils';

// BIP32 Public Key: xpub6ELgkkwgfoky9h9fFu4Auvx6oHvJ6XfwiS1NE616fe9Uf4H3JHtLGjCePVkb6RFcyDCqVvjXhNXbDNDqs6Kjoxw7pTAeP1GSEiLHmA5wYa9
// BIP32 Private Key: xprvA1MLMFQnqSCfwD5C9sXAYo1NFG5oh4x6MD5mRhbV7JcVnFwtkka5ivtAYDYJsr9GS242p3QZMbsMZC1GZ2uskNeTj9VhYxrCqRG6U5UPXp5
export const KNOWN_PUBLIC_KEY =
  '03752603a8131fd03fe726434e82a181c3a6bc227a44660ab774a482d29d1172c3';

export const CHAIN_CODE =
  '2b73df9ce5df820c728c8f77d51a72ec578e25c6a3c5e32b65fd43d2b4fb0e63';

export const KNOWN_PUBLIC_KEY_ADDRESSES = [
  {
    address: '0x3FB034C6a9F4Da3F61709dBe720033A66984caf1',
    balance: null,
    index: 0,
  },
  {
    address: '0xFe20B747d3C303477ba25cA4F3D9355D7f70e859',
    balance: null,
    index: 1,
  },
  {
    address: '0x137560Ff91A3c23Fec7358f7951Fcca54640286C',
    balance: null,
    index: 2,
  },
  {
    address: '0x673092aEf16Fe80F1d70706542088bA70d56a958',
    balance: null,
    index: 3,
  },
  {
    address: '0xE4A7f01F07f2480689dCe33B91689c60D49a3ebF',
    balance: null,
    index: 4,
  },
];

export const KNOWN_PRIVATE_KEYS = [
  '94fcd35a5158e20887c16da639e57ef396f0bbb556f77b77521e554e66706315',
  'da082fa089ff95e6ceeb08b43e1d9bf95704e8576918c8ad6a04a66e6487bda4',
  '95302f091c3a0727e089a474cba5af3556853176d2058dfac35e4a9287ba38af',
  'bf34ba46c7bcedf2c5f9a6831fba4f17d0cd698ba03c8c81d197f40d94df9a35',
  'd8d0f0366be34ed439cc93992c46c6ded69b06f1888e9bc727545aba7732f2a2',
];

const KNOWN_QR_CBOR =
  'a503582103abc7af7fd5cd4fd1ec4c0f67f4bca461efb9dfc2578f8ed347d31201050377a0045820672f2b2bfda55552f56f5421d2bd106e55f2e94e73337d5f3f219906b39bfa4a06d90130a20186182cf5183cf500f5021a65174ca1081a65633532096d416972476170202d2074657374';

export const KNOWN_QR_ACCOUNTS = [
  {
    address: '0x8DC309e828CE024b1ae7a9AA7882D37AD18181d5',
  },
  {
    address: '0x98396D8bF756F419eF6CDba819e9DF00E6F2B51B',
  },
  {
    address: '0xC64D05CD3582531f19dcB16e5FA9652B281fA018',
  },
];

export class FakeKeyringBridge {
  async init() {
    return Promise.resolve();
  }
}

export class FakeTrezorBridge extends FakeKeyringBridge {
  #trezorPublicKeyPayload;

  constructor() {
    super();
    // Initialize Trezor's specific payload
    this.#trezorPublicKeyPayload = {
      success: true,
      payload: {
        publicKey: KNOWN_PUBLIC_KEY,
        chainCode: CHAIN_CODE,
        address: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
      },
    };
  }

  // Added specific getPublicKey for Trezor
  async getPublicKey() {
    return this.#trezorPublicKeyPayload;
  }

  async dispose() {
    return Promise.resolve();
  }

  async ethereumSignMessage(params) {
    const { message } = params;
    const signature = personalSign({
      privateKey: KNOWN_PRIVATE_KEYS[0],
      data: add0x(message),
    });
    return {
      id: 1,
      success: true,
      payload: {
        address: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        signature: remove0x(signature),
      },
    };
  }

  async ethereumSignTransaction({ transaction }) {
    const txType = Number(transaction.type);
    let hardfork;
    switch (txType) {
      case 0:
        hardfork = 'muirGlacier';
        break;
      case 1:
        throw new Error(
          'Unsupported transaction type: EIP-2930 (type 1) not yet implemented in FakeTrezorBridge.',
        );
      case 2:
        hardfork = 'london';
        break;
      default:
        throw new Error(`Unsupported transaction type: ${txType}`);
    }
    const common = Common.custom({
      chain: {
        name: 'localhost',
        chainId: transaction.chainId,
        networkId: transaction.chainId,
      },
      chainId: transaction.chainId,
      hardfork,
    });

    const signedTransaction = TransactionFactory.fromTxData(transaction, {
      common,
    }).sign(Buffer.from(KNOWN_PRIVATE_KEYS[0], 'hex'));

    return {
      id: 1,
      success: true,
      payload: {
        v: bigIntToHex(signedTransaction.v),
        r: bigIntToHex(signedTransaction.r),
        s: bigIntToHex(signedTransaction.s),
        serializedTx: bytesToHex(signedTransaction.serialize()),
      },
    };
  }

  async ethereumSignTypedData(message) {
    const typedData = {
      types: message.data.types,
      domain: message.data.domain,
      primaryType: message.data.primaryType,
      message: message.data.message,
    };

    const signature = signTypedData({
      privateKey: KNOWN_PRIVATE_KEYS[0],
      data: typedData,
      version: SignTypedDataVersion.V4,
    });

    return {
      id: 1,
      success: true,
      payload: {
        address: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
        signature,
      },
    };
  }
}

export class FakeLedgerBridge extends FakeKeyringBridge {
  /**
   * Retrieves a public key and address based on the HD path provided in params.
   * The HD path is expected to be a string, (e.g., "m/44'/60'/X'/0/0" or "44'/60'/X'/0/0"),
   * where 'X' is the account index.
   * It extracts the account index from the path (the third component from the end)
   * and returns the corresponding address from KNOWN_PUBLIC_KEY_ADDRESSES.
   * If the index is invalid or out of bounds, it defaults to index 0.
   *
   * @param {object} params - The parameters object.
   * @param {string} params.hdPath - The hierarchical derivation path.
   * @returns {Promise<object>} A promise that resolves to an object containing
   * the public key, chain code, and derived address.
   */
  async getPublicKey(params) {
    // params.hdPath is expected to be a string like "m/44'/60'/0'/0/0" or "44'/60'/X'/0/0"
    const { hdPath } = params;
    const parts = hdPath.split('/');
    // The account index (e.g., 0, 1, 2) is the third component from the end of the path.
    // For example, in "44'/60'/1'/0/0", parts[parts.length - 3] would be "1'"
    const indexComponent = parts[parts.length - 3];
    const index = parseInt(indexComponent, 10); // Extracts the integer value, e.g., 1 from "1'"

    // Validate the extracted index; default to 0 if it's not a number or out of bounds.
    const validIndex =
      !isNaN(index) && index >= 0 && index < KNOWN_PUBLIC_KEY_ADDRESSES.length
        ? index
        : 0;

    const { address } = KNOWN_PUBLIC_KEY_ADDRESSES[validIndex];

    // Returns a payload containing the public key, chain code, and the derived address.
    // Assumes KNOWN_PUBLIC_KEY and CHAIN_CODE are constant for all derived addresses.
    return {
      publicKey: KNOWN_PUBLIC_KEY,
      chainCode: CHAIN_CODE,
      address,
    };
  }

  async destroy() {
    return Promise.resolve();
  }

  /**
   * Signs a transaction using a private key.
   * This function supports both legacy (type 0) and EIP-1559 (type 2) transactions.
   * It decodes the RLP-encoded transaction, signs it, and then returns the
   * signature components (v, r, s) as hexadecimal strings.
   *
   * @param {object} params - The parameters object.
   * @param {string} params.tx - The RLP-encoded transaction as a hex string.
   * @returns {Promise<object>} A promise that resolves to an object containing the
   * signature components:
   * - `v`: The recovery id as a hex string.
   * - `r`: The R component of the signature as a hex string.
   * - `s`: The S component of the signature as a hex string.
   * @throws {Error} If the transaction type is unsupported.
   */
  async deviceSignTransaction({ tx }) {
    const txBuffer = Buffer.from(tx, 'hex');
    const firstByte = txBuffer[0];
    let txType;
    let rlpData;
    let parsedChainId;

    // Determine the transaction type from the first byte of the buffer
    if (firstByte === 1) {
      txType = 1; // EIP-2930
      // TODO: Add support for type 1 tx if needed, for now, error out
      throw new Error(
        'Unsupported transaction type: EIP-2930 (type 1) not yet implemented in FakeLedgerBridge.',
      );
    } else if (firstByte === 2) {
      txType = 2; // EIP-1559
      rlpData = txBuffer.slice(1);
      const decodedRlp = rlp.decode(rlpData);
      parsedChainId = bytesToBigInt(decodedRlp[0]); // chainId is the first element
    } else {
      txType = 0; // Legacy
      rlpData = txBuffer;
      const decodedRlp = rlp.decode(rlpData);
      // For legacy tx, getMessageToSign(false) includes chainId as the 7th element (index 6)
      // [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
      parsedChainId = bytesToBigInt(decodedRlp[6]);
    }

    const common = Common.custom({
      chain: {
        name: 'localhost',
        // Use the parsed chainId. networkId can be the same.
        chainId: parsedChainId,
        networkId: parsedChainId,
      },
      chainId: parsedChainId,
      // Ensure hardfork is appropriate for the transaction type
      hardfork: txType === 2 ? 'london' : 'muirGlacier',
    });

    // removing r, s, v values from the unsigned tx
    // Ledger uses v to communicate the chain ID, but we're removing it because these values are not a valid signature at this point.

    // Type 1 and type 2 transactions have an explicit type set in the first element of the array
    // Type 0 transactions do not have a specific type byte and are identified by their RLP encoding

    // TODO: add support to type 1 transactions (already handled by throwing error)
    if (txType === 0) {
      const rlpTx = rlp.decode(rlpData);

      // For legacy tx, fromValuesArray expects [nonce, gasPrice, gasLimit, to, value, data]
      // or [nonce, gasPrice, gasLimit, to, value, data, v, r, s]
      // Since our rlpTx is [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0],
      // we should pass the first 6 elements, and `common` will handle EIP-155.
      const signedTx = LegacyTransaction.fromValuesArray(rlpTx.slice(0, 6), {
        common,
      }).sign(Buffer.from(KNOWN_PRIVATE_KEYS[0], 'hex'));
      return {
        v: bigIntToHex(signedTx.v),
        r: bigIntToHex(signedTx.r),
        s: bigIntToHex(signedTx.s),
      };
    } else if (txType === 2) {
      const rlpTx = rlp.decode(rlpData);

      // For EIP-1559 tx, fromValuesArray expects:
      // [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList]
      // or with v, r, s. Our rlpTx matches the unsigned form.
      const signedTx = FeeMarketEIP1559Transaction.fromValuesArray(rlpTx, {
        common,
      }).sign(Buffer.from(KNOWN_PRIVATE_KEYS[0], 'hex'));
      return {
        v: bigIntToHex(signedTx.v),
        r: bigIntToHex(signedTx.r),
        s: bigIntToHex(signedTx.s),
      };
    }

    throw new Error('Unsupported transaction type.');
  }

  updateTransportMethod() {
    return true;
  }

  async deviceSignTypedData(params) {
    const { domain, types, primaryType, message } = params.message;
    const typedData = {
      types,
      domain,
      primaryType,
      message,
    };
    const signature = signTypedData({
      privateKey: KNOWN_PRIVATE_KEYS[0],
      data: typedData,
      version: SignTypedDataVersion.V4,
    });
    // signTypedData returns an hex, we need to split it into rsv format
    const { r, s, v } = EthersUtils.splitSignature(signature);

    // Split signature adds 0x prefixes for r and s, we need to strip them.
    return {
      r: remove0x(r),
      s: remove0x(s),
      v,
    };
  }

  async deviceSignMessage(params) {
    const { message } = params;
    const signature = personalSign({
      privateKey: KNOWN_PRIVATE_KEYS[0],
      data: add0x(message),
    });
    const { r, s, v } = EthersUtils.splitSignature(signature);

    // Split signature adds 0x prefixes for r and s, we need to strip them.
    return {
      r: remove0x(r),
      s: remove0x(s),
      v,
    };
  }
}

export class FakeQrBridge {
  async requestScan() {
    return {
      type: 'crypto-hdkey',
      cbor: KNOWN_QR_CBOR,
    };
  }
}
