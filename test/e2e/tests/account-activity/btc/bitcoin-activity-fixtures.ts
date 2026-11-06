import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import {
  BTC_CHAIN_ID,
  BTC_CHAIN_ID_NUMERIC,
  BTC_NATIVE_ASSET,
  ETH_NATIVE_ASSET,
} from '../../btc/mocks/bridge';

const BTC_ASSET_TYPE = `${BTC_CHAIN_ID}/slip44:0`;

export type BitcoinActivityTransaction = {
  type: 'send';
  id: string;
  account: string;
  chain: typeof BTC_CHAIN_ID;
  status: 'confirmed' | 'failed' | 'unconfirmed';
  timestamp: number;
  events: {
    status: 'confirmed' | 'failed' | 'unconfirmed';
    timestamp: number;
  }[];
  to: {
    address: string;
    asset: {
      amount: string;
      fungible: true;
      unit: 'BTC';
      type: typeof BTC_ASSET_TYPE;
    };
  }[];
  from: [];
  fees: [];
};

export function bitcoinSendActivityTransaction({
  id,
  account,
  amount,
  recipient,
  status,
  timestamp = Date.now(),
}: {
  id: string;
  account: string;
  amount: string;
  recipient: string;
  status: BitcoinActivityTransaction['status'];
  timestamp?: number;
}): BitcoinActivityTransaction {
  return {
    type: 'send',
    id,
    account,
    chain: BTC_CHAIN_ID,
    status,
    timestamp,
    events: [{ status, timestamp }],
    to: [
      {
        address: recipient,
        asset: {
          amount,
          fungible: true,
          unit: 'BTC',
          type: BTC_ASSET_TYPE,
        },
      },
    ],
    from: [],
    fees: [],
  };
}

export function bitcoinBridgeHistoryItem({
  account,
  transactionId,
  srcAmount,
  destAmount,
  timestamp = Date.now(),
}: {
  account: string;
  transactionId: string;
  srcAmount: string;
  destAmount: string;
  timestamp?: number;
}): BridgeHistoryItem {
  const srcAsset = BTC_NATIVE_ASSET as BridgeHistoryItem['quote']['srcAsset'];
  const destAsset = ETH_NATIVE_ASSET as BridgeHistoryItem['quote']['destAsset'];

  return {
    account,
    hasApprovalTx: false,
    quote: {
      srcChainId: BTC_CHAIN_ID_NUMERIC,
      destChainId: 1,
      srcTokenAmount: srcAmount,
      destTokenAmount: destAmount,
      srcAsset,
      destAsset,
      requestId: transactionId,
      feeData: {
        metabridge: {
          amount: '0',
          asset: srcAsset,
        },
      },
      steps: [],
      bridgeId: 'rango',
      bridges: ['rango'],
    },
    status: {
      status: StatusTypes.COMPLETE,
      srcChain: {
        chainId: BTC_CHAIN_ID_NUMERIC,
        txHash: transactionId,
        amount: srcAmount,
        token: srcAsset,
      },
      destChain: {
        chainId: 1,
        txHash: `0x${'ab'.repeat(32)}`,
        amount: destAmount,
        token: destAsset,
      },
    },
    startTime: timestamp,
    estimatedProcessingTimeInSeconds: 60,
    slippagePercentage: 0.5,
  };
}

export function bitcoinActivityControllerState(
  accountId: string,
  transaction: BitcoinActivityTransaction,
): MultichainTransactionsControllerState {
  return {
    nonEvmTransactions: {
      [accountId]: {
        [BTC_CHAIN_ID]: {
          transactions: [transaction],
          next: null,
          lastUpdated: transaction.timestamp,
        },
      },
    },
  };
}
