import type { Transaction } from '@metamask/keyring-api';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import type { TransactionGroup } from '../multichain/types';

export type Status = 'pending' | 'success' | 'failed' | 'cancelled';

export type ActivityKind =
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

type ActivityData<Type extends ActivityKind, Data> = {
  type: Type;
  chainId: CaipChainId;
  status: Status;
  timestamp: number;
  isEarliestNonce?: boolean;
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
  | ActivityData<
      'send' | 'receive',
      {
        from: string;
        to: string;
        token?: TokenAmount;
      }
    >
  | ActivityData<
      | 'swap'
      | 'convert'
      | 'lendingDeposit'
      | 'lendingWithdrawal'
      | 'wrap'
      | 'unwrap',
      {
        sourceToken?: TokenAmount;
        destinationToken?: TokenAmount;
      }
    >
  | ActivityData<
      'swapIncomplete',
      {
        sourceToken?: TokenAmount;
      }
    >
  | ActivityData<
      'bridge',
      {
        sourceToken?: TokenAmount;
        destinationToken?: TokenAmount;
      }
    >
  | ActivityData<
      'buy' | 'claim' | 'deposit',
      {
        token?: TokenAmount;
      }
    >
  | ActivityData<
      'claimMusdBonus',
      {
        token?: TokenAmount;
      }
    >
  | ActivityData<
      'approveSpendingCap' | 'revokeSpendingCap' | 'increaseSpendingCap',
      {
        token?: TokenAmount;
      }
    >
  | ActivityData<
      'nftMint',
      {
        from: string;
        to: string;
        token?: TokenAmount;
      }
    >
  | ActivityData<
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
