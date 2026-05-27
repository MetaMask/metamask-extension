import type { CaipChainId } from '@metamask/utils';

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
  direction: 'in' | 'out';
};

type ActivityItem<Type extends ActivityType, Data> = {
  type: Type;
  chainId: CaipChainId;
  status: Status;
  timestamp: number;
  /** TransactionController meta id used for cancel / speed up buttons */
  metaId?: string;
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
        tokenSymbol?: string;
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
        methodId?: string;
        transactionCategory?: string;
        transactionProtocol?: string;
        transactionType?: string;
      }
    >;
