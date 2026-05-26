import type { Transaction } from '@metamask/keyring-api';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import type { TransactionGroup } from '../multichain/types';

export type Status = 'pending' | 'success' | 'failed';

export type ActivityType =
  | 'receive'
  | 'sell'
  | 'buy'
  | 'deposit'
  | 'swap'
  | 'swapIncomplete'
  | 'claim'
  | 'claimMusdBonus'
  | 'send'
  | 'wrap'
  | 'unwrap'
  | 'approveSpendingCap'
  | 'revokeSpendingCap'
  | 'increaseSpendingCap'
  | 'contractInteraction'
  | 'contractDeployment'
  | 'bridge'
  | 'convert'
  | 'smartAccountUpgrade'
  | 'lendingDeposit'
  | 'lendingWithdrawal'
  | 'predictionsAddFunds'
  | 'predictionsWithdrawFunds'
  | 'predictionClaimWinnings'
  | 'predictionCashedOut'
  | 'predictionPlaced'
  | 'perpsAddFunds'
  | 'perpsWithdrawFunds'
  | 'perpsOpenLong'
  | 'perpsCloseLong'
  | 'perpsCloseLongLiquidated'
  | 'perpsCloseLongStopLoss'
  | 'perpsOpenShort'
  | 'perpsCloseShort'
  | 'perpsCloseShortLiquidated'
  | 'perpsCloseShortStopLoss'
  | 'perpsPaidFundingFees'
  | 'perpsReceivedFundingFees'
  | 'perpsCloseShortTakeProfit'
  | 'perpsCloseLongTakeProfit'
  | 'marketShort'
  | 'stopMarketCloseShort'
  | 'marketCloseShort'
  | 'nftMint';

export type TokenAmount = {
  amount?: string;
  decimals?: number;
  symbol?: string;
  // CAIP-19 asset id (from adapters)
  assetId?: string;
  direction: 'in' | 'out';
};

type ActivityItem<Type extends ActivityType, Data> = {
  type: Type;
  chainId: CaipChainId;
  status: Status;
  timestamp: number;
  /* Used by legacy details modals. Interim until redesigned details are implemented */
  raw?:
    | { type: 'apiEvmTransaction'; data: V1TransactionByHashResponse }
    | { type: 'keyringTransaction'; data: Transaction }
    | { type: 'localTransaction'; data: TransactionGroup };
  data: Data & {
    hash?: string;
  };
};

export type ActivityListItem =
  | ActivityItem<
      'send' | 'receive',
      {
        from: string;
        to: string;
        token?: TokenAmount;
      }
    >
  | ActivityItem<
      'swap',
      {
        sourceToken?: TokenAmount;
        destinationToken?: TokenAmount;
      }
    >
  | ActivityItem<
      'swapIncomplete',
      {
        sourceToken?: TokenAmount;
      }
    >
  | ActivityItem<
      'bridge',
      {
        sourceToken?: TokenAmount;
        destinationToken?: TokenAmount;
      }
    >
  | ActivityItem<
      'buy' | 'lendingDeposit' | 'claim',
      {
        token?: TokenAmount;
      }
    >
  | ActivityItem<
      'claimMusdBonus',
      {
        token?: TokenAmount;
      }
    >
  | ActivityItem<
      'approveSpendingCap' | 'revokeSpendingCap' | 'increaseSpendingCap',
      {
        token?: TokenAmount;
      }
    >
  | ActivityItem<
      'nftMint',
      {
        from: string;
        to: string;
        token?: TokenAmount;
      }
    >
  | ActivityItem<
      'contractInteraction',
      {
        from: string;
        to: string;
        token?: TokenAmount;
        methodId?: string;
        transactionCategory?: string;
        transactionProtocol?: string;
        transactionType?: string;
      }
    >;
