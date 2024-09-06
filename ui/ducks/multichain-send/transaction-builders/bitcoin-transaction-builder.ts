import { CaipChainId } from '@metamask/utils';
import { AnyAction, Dispatch } from 'redux';
import { CaipAssetId, InternalAccount } from '@metamask/keyring-api';
import {
  record,
  object,
  string,
  optional,
  array,
  literal,
  Infer,
  is,
} from '@metamask/superstruct';
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';
import { HandlerType } from '@metamask/snaps-utils';
import { validate } from 'bitcoin-address-validation';
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
import { isBtcMainnetAddress } from '../../../../shared/lib/multichain';
import { getBtcCachedBalance } from '../../../selectors/multichain';
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
  dryrun: literal(false),
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
      state: MultichainSendState;
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
    // amount should be a of type btc
    // TODO: validate amount

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
        [this.transactionParams.recipient.address]:
          this.transactionParams.sendAsset.amount,
      },
      comment: '', // Optional value. Default to empty.
      subtractFeeFrom: [], // Optional value. Default to sender if left empty.
      replaceable: true, // Default to true.
      dryrun: false, // Default to false.
    };

    this.transaction = sendManyTransaction;

    // validate transaction
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
        fee: estimatedFee.fee.amount,
        unit: estimatedFee.fee.unit,
        error: '',
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
    // const maxSpendableBalance = (await handleSnapRequest({
    //   snapId: BITCOIN_WALLET_SNAP_ID,
    //   origin: 'metamask',
    //   handler: HandlerType.OnKeyringRequest,
    //   request: {
    //     method: 'keyring_getAccountBalances',
    //     params: {
    //       account: this.account.id,
    //       assets: [this.transactionParams.sendAsset.asset],
    //       // amount: this.transactionParams.sendAsset.amount,
    //     },
    //   },
    // })) as {
    //   balance: {
    //     amount: string;
    //     unit: string;
    //   };
    //   fee: {
    //     amount: string;
    //     unit: string;
    //   };
    // };
    // return maxSpendableBalance.balance;
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
          error: '',
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
      },
    };

    if (
      ![
        MultichainNativeAssets.BITCOIN,
        MultichainNativeAssets.BITCOIN_TESTNET,
      ].includes(asset)
    ) {
      this.transactionParams = {
        ...this.transactionParams,
        sendAsset: {
          ...this.transactionParams.sendAsset,
          error: `Invalid asset: ${asset}`,
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
        },
      };
    }

    return this.transactionParams.fee;
  }

  setRecipient(
    recipient: string,
  ): DraftTransaction['transactionParams']['recipient'] {
    console.log('recipient', recipient);
    console.log(this.network);
    if (
      (this.network === MultichainNetworks.BITCOIN &&
        !isBtcMainnetAddress(recipient)) ||
      (this.network === MultichainNetworks.BITCOIN_TESTNET &&
        !validate(recipient, 'testnet'))
    ) {
      this.transactionParams = {
        ...this.transactionParams,
        recipient: {
          ...this.transactionParams.recipient,
          address: recipient,
          valid: false,
          error: 'Invalid recipient address',
        },
      };
      return this.transactionParams.recipient;
    }
    console.log('is valid address');

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

    return (await handleSnapRequest({
      snapId: BITCOIN_WALLET_SNAP_ID,
      origin: 'metamask',
      handler: HandlerType.OnKeyringRequest,
      request: {
        method: 'sendMany',
        params: {
          account: this.account.id,
          params: this.transaction,
        },
      },
    })) as string;
  }

  async sendTransaction(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  getCachedAccountBalance(): string {
    const state = this.thunkApi.getState();

    return getBtcCachedBalance(state);
  }
}
