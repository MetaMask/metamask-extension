import { CaipChainId } from '@metamask/utils';
import { AnyAction, Dispatch } from 'redux';
import { v4 as uuidv4 } from 'uuid';
import {
  BtcMethod,
  CaipAssetId,
  InternalAccount,
  KeyringRpcMethod,
} from '@metamask/keyring-api';
import {
  record,
  object,
  string,
  optional,
  array,
  literal,
  Infer,
  is,
  boolean,
} from '@metamask/superstruct';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { HandlerType } from '@metamask/snaps-utils';
import {
  Network as BitcoinNetwork,
  validate,
} from 'bitcoin-address-validation';
import { BigNumber } from 'bignumber.js';
import {
  DraftTransaction,
  FeeLevel,
  MultichainSendState,
  TransactionParams,
} from '../multichain-send';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { handleSnapRequest } from '../../../store/actions';
import { BITCOIN_WALLET_SNAP_ID } from '../../../../app/scripts/lib/snap-keyring/bitcoin-wallet-snap';
import { getBtcCachedBalance } from '../../../selectors/multichain';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  INVALID_AMOUNT_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
} from '../../../pages/confirmations/send/send.constants';
import { AbstractTransactionBuilder } from './abstract-transaction-builder';

const SUPPORTED_BTC_NETWORKS = [
  MultichainNetworks.BITCOIN,
  MultichainNetworks.BITCOIN_TESTNET,
];

export const SendManyTransactionStruct = object({
  amounts: record(string(), string()), // TODO: change key string to btc account type
  comment: optional(string()),
  subtractFeeFrom: optional(array(string())),
  replaceable: literal(true),
  dryrun: boolean(),
});

export const defaultSendManyTransaction: SendManyTransaction = {
  amounts: {},
  comment: '',
  subtractFeeFrom: [],
  replaceable: true,
  dryrun: false,
};

export type SendManyTransaction = Infer<typeof SendManyTransactionStruct>;

export class BitcoinTransactionBuilder extends AbstractTransactionBuilder {
  transaction: SendManyTransaction;

  constructor(
    thunkApi: GetThunkAPI<{
      state: { multichainSend: MultichainSendState };
      dispatch: Dispatch<AnyAction>;
    }>,
    account: InternalAccount,
    network: CaipChainId,
    transactionParams: TransactionParams,
  ) {
    super(thunkApi, account, network, transactionParams);
    this.transaction = { ...defaultSendManyTransaction };
  }

  setAmount(
    amount: string,
  ): DraftTransaction['transactionParams']['sendAsset'] {
    const maxSatoshis = new BigNumber('21000000').mul(new BigNumber(10).pow(8));

    if (new BigNumber(amount).gt(maxSatoshis) || new BigNumber(amount).lt(0)) {
      this.transactionParams = {
        ...this.transactionParams,
        sendAsset: {
          ...this.transactionParams.sendAsset,
          error: INVALID_AMOUNT_ERROR,
        },
      };
      return this.transactionParams.sendAsset;
    }

    this.transaction.amounts[this.transactionParams.recipient.address] = amount;
    this.transactionParams = {
      ...this.transactionParams,
      sendAsset: {
        ...this.transactionParams.sendAsset,
        assetDetails: {
          ...this.transactionParams.sendAsset.assetDetails,
          balance: amount,
        },
        error: '',
      },
    };

    return this.transactionParams.sendAsset;
  }

  buildTransaction(): void {
    const sendManyTransaction: SendManyTransaction = {
      amounts: {
        [this.transactionParams.recipient.address]: new BigNumber(
          this.transactionParams.sendAsset.amount,
        )
          .div(new BigNumber(10).pow(8))
          .toString(), // convert back to btc
      },
      comment: '', // Optional value. Default to empty.
      subtractFeeFrom: [], // Optional value. Default to sender if left empty.
      replaceable: true, // Default to true.
      dryrun: false, // Default to false.
    };

    this.transaction = sendManyTransaction;
  }

  async estimateGas(): Promise<DraftTransaction['transactionParams']['fee']> {
    if (!this.transactionParams.sendAsset.amount) {
      this.transactionParams = {
        ...this.transactionParams,
        fee: {
          ...this.transactionParams.fee,
          error: 'Amount is required',
        },
      };
      return this.transactionParams.fee;
    }

    const estimatedFee = (await handleSnapRequest({
      snapId: BITCOIN_WALLET_SNAP_ID,
      origin: 'metamask',
      handler: HandlerType.OnRpcRequest,
      request: {
        method: 'estimateFee',
        params: {
          account: this.account.id,
          amount: this.transactionParams.sendAsset.amount,
        },
      },
    })) as {
      fee: {
        amount: string;
        unit: string;
      };
    };

    this.transactionParams = {
      ...this.transactionParams,
      fee: {
        ...this.transactionParams.fee,
        fee: new BigNumber(estimatedFee.fee.amount)
          .mul(new BigNumber(10).pow(8))
          .toString(),
        unit: estimatedFee.fee.unit,
        error: '',
        // TODO: remove hardcode
        confirmationTime: '10 minutes',
      },
    };

    return this.transactionParams.fee;
  }

  async queryAssetBalance(): Promise<{
    amount: string;
    unit: string;
  }> {
    const balance = this.getCachedAccountBalance();
    return {
      amount: balance,
      unit: 'BTC',
    };
  }

  validateTransaction(): boolean {
    // TODO: Validate if send amount is sufficient

    return is(this.transaction, SendManyTransactionStruct);
  }

  setSendAsset(
    asset?: CaipAssetId,
  ): DraftTransaction['transactionParams']['sendAsset'] {
    if (!asset) {
      this.transactionParams = {
        ...this.transactionParams,
        sendAsset: {
          ...this.transactionParams.sendAsset,
          asset:
            this.network === MultichainNetworks.BITCOIN
              ? MultichainNativeAssets.BITCOIN
              : MultichainNativeAssets.BITCOIN_TESTNET,
          assetDetails: {
            type: AssetType.native,
            // TODO: allow btc logo
            // @ts-expect-error image is not included
            image: './images/bitcoin-logo.svg',
            symbol: 'BTC',
            balance: this.getCachedAccountBalance() ?? '0',
            details: {
              decimals: 8,
            },
          },
          error: '',
          valid: true,
        },
      };
      return this.transactionParams.sendAsset;
    }

    this.transactionParams = {
      ...this.transactionParams,
      sendAsset: {
        ...this.transactionParams.sendAsset,
        asset,
        error: '',
        valid: true,
      },
    };

    if (
      ![
        MultichainNativeAssets.BITCOIN,
        MultichainNativeAssets.BITCOIN_TESTNET,
      ].includes(asset as MultichainNativeAssets)
    ) {
      this.transactionParams = {
        ...this.transactionParams,
        sendAsset: {
          ...this.transactionParams.sendAsset,
          error: `Invalid asset: ${asset}`,
          valid: false,
        },
      };
    }

    // TODO: allow asset to ordinals / runes / brc20

    return this.transactionParams.sendAsset;
  }

  setNetwork(
    network: CaipChainId,
  ): DraftTransaction['transactionParams']['network'] {
    if (!SUPPORTED_BTC_NETWORKS.includes(network as MultichainNetworks)) {
      this.transactionParams = {
        ...this.transactionParams,
        network: {
          ...this.transactionParams.network,
          error: `Invalid network: ${network}`,
        },
      };
      return this.transactionParams.network;
    }

    this.transactionParams = {
      ...this.transactionParams,
      network: {
        ...this.transactionParams.network,
        network,
        error: '',
      },
    };
    return this.transactionParams.network;
  }

  async setFee(
    fee: FeeLevel,
  ): Promise<
    MultichainSendState['draftTransactions'][string]['transactionParams']['fee']
  > {
    if (!this.transactionParams.sendAsset.amount) {
      this.transactionParams = {
        ...this.transactionParams,
        fee: {
          ...this.transactionParams.fee,
          error: 'Amount is required',
        },
      };
      return this.transactionParams.fee;
    }

    // TODO: Add custom logic for priority fees

    let estimatedFee;
    try {
      estimatedFee = (await handleSnapRequest({
        snapId: BITCOIN_WALLET_SNAP_ID,
        origin: 'metamask',
        handler: HandlerType.OnRpcRequest,
        request: {
          method: 'estimateFee',
          params: {
            account: this.account.id,
            amount: this.transactionParams.sendAsset.amount,
          },
        },
      })) as {
        fee: {
          amount: string;
          unit: string;
        };
      };
      this.transactionParams = {
        ...this.transactionParams,
        fee: {
          ...this.transactionParams.fee,
          fee: estimatedFee.fee.amount,
          unit: estimatedFee.fee.unit,
          error: '',
          feeLevel: fee,
          valid: true,
        },
      };
    } catch (e) {
      this.transactionParams = {
        ...this.transactionParams,
        fee: {
          ...this.transactionParams.fee,
          fee: '',
          unit: '',
          error: `Error estimating fee: ${e}`,
          valid: false,
        },
      };
    }

    return this.transactionParams.fee;
  }

  setRecipient(
    recipient: string,
  ): DraftTransaction['transactionParams']['recipient'] {
    if (
      (this.network === MultichainNetworks.BITCOIN &&
        validate(recipient, BitcoinNetwork.mainnet)) ||
      (this.network === MultichainNetworks.BITCOIN_TESTNET &&
        !validate(recipient, BitcoinNetwork.testnet))
    ) {
      this.transactionParams = {
        ...this.transactionParams,
        recipient: {
          ...this.transactionParams.recipient,
          address: recipient,
          valid: false,
          error: INVALID_RECIPIENT_ADDRESS_ERROR,
        },
      };
      return this.transactionParams.recipient;
    }
    this.transactionParams = {
      ...this.transactionParams,
      recipient: {
        ...this.transactionParams.recipient,
        address: recipient,
        valid: true,
        error: '',
      },
    };

    return this.transactionParams.recipient;
  }

  async signTransaction(): Promise<string> {
    if (!this.validateTransaction()) {
      throw new Error('Invalid transaction');
    }

    const tx = (await handleSnapRequest({
      snapId: BITCOIN_WALLET_SNAP_ID,
      origin: 'metamask',
      handler: HandlerType.OnKeyringRequest,
      request: {
        method: KeyringRpcMethod.SubmitRequest,
        params: {
          id: uuidv4(),
          scope: this.network,
          account: this.account.id,
          request: {
            method: BtcMethod.SendMany,
            params: this.transaction,
          },
        },
      },
    })) as {
      pending: boolean;
      result: {
        txId: string;
        signedTransaction: string;
      };
    };

    console.log('signed transaction', tx);

    return tx.result.txId;
  }

  async sendTransaction(transaction: string): Promise<string> {
    // already sent in the sign
    return transaction;
  }

  getCachedAccountBalance(): string {
    const state = this.thunkApi.getState();

    // @ts-expect-error The root state type is incorrect.
    const balance = getBtcCachedBalance(state);
    return balance;
  }

  async setMaxSendAmount(): Promise<string> {
    const maxAmount = (await handleSnapRequest({
      snapId: BITCOIN_WALLET_SNAP_ID,
      origin: 'metamask',
      handler: HandlerType.OnRpcRequest,
      request: {
        method: 'getMaxSpendableBalance',
        params: {
          account: this.account.id,
        },
      },
    })) as {
      fee: {
        amount: string;
        unit: string;
      };
      balance: {
        amount: string;
        unit: string; // Bitcoin Manager returns btc
      };
    };

    const maxAmountInSats = new BigNumber(maxAmount.balance.amount)
      .mul(new BigNumber(10).pow(8))
      .toString();

    return maxAmountInSats;
  }
}
