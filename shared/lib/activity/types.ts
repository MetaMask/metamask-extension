import type { CaipChainId } from '@metamask/utils';

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
  | 'nftBuy'
  | 'nftMint'
  | 'smartAccountUpgrade'
  | 'lendingDeposit'
  | 'lendingWithdrawal'
  | 'predictionsAddFunds'
  | 'predictionsWithdrawFunds'
  | 'predictionClaimWinnings'
  | 'predictionCashedOut'
  | 'predictionPlaced'
  | 'perpsAddFunds'
  | 'perpsWithdraw'
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
  | 'marketCloseShort';

export type TokenAmount = {
  amount?: string;
  decimals?: number;
  symbol?: string;
  assetId?: string;
  direction: 'in' | 'out';
};

export type ActivityFee = {
  type: string;
  amount?: string;
  decimals?: number;
  symbol?: string;
  assetId?: string;
};

type ActivityData<Type extends ActivityKind, Data> = {
  type: Type;
  chainId: CaipChainId;
  status: Status;
  timestamp: number;
  isEarliestNonce?: boolean;
  data: Data & {
    hash?: string;
    from?: string;
  };
};

export type ActivityListItem =
  | ActivityData<
      'send' | 'receive',
      {
        from: string;
        to: string;
        token?: TokenAmount;
        fees?: ActivityFee[];
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
        fees?: ActivityFee[];
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
        fees?: ActivityFee[];
      }
    >
  | ActivityData<
      'buy' | 'claim',
      {
        token?: TokenAmount;
      }
    >
  | ActivityData<
      'deposit',
      {
        token?: TokenAmount;
        from?: string;
      }
    >
  | ActivityData<
      'perpsAddFunds' | 'perpsWithdraw',
      {
        fiat?: {
          amount: string;
          currency?: string;
        };
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
        fees?: ActivityFee[];
      }
    >
  | ActivityData<
      'nftBuy' | 'nftMint',
      {
        from?: string;
        to?: string;
        token?: TokenAmount;
      }
    >
  | ActivityData<
      'contractInteraction',
      {
        from: string;
        to: string;
        token?: TokenAmount;
        fees?: ActivityFee[];
        methodId?: string;
        transactionCategory?: string;
        transactionProtocol?: string;
        transactionType?: string;
      }
    >;
