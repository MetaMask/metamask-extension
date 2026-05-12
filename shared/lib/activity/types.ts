import type { CaipChainId } from '@metamask/utils';

export type Status = 'pending' | 'success' | 'failed';

export type ActivityType =
  | 'receive'
  | 'sell'
  | 'buy'
  | 'deposit'
  | 'swap'
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
  | 'marketCloseShort';

export type ActivityListItem =
  | {
      type: 'send';
      chainId: CaipChainId;
      status: Status;
      timestamp: number;
      data: {
        from: string;
        to: string;
        tokenSymbol?: string;
      };
    }
  | {
      type: 'receive';
      chainId: CaipChainId;
      status: Status;
      timestamp: number;
      data: {
        from: string;
        to: string;
        tokenSymbol?: string;
      };
    }
  | {
      type: 'swap';
      chainId: CaipChainId;
      status: Status;
      timestamp: number;
      data: {
        destinationTokenSymbol?: string;
        sourceTokenSymbol?: string;
      };
    }
  | {
      type: 'approveSpendingCap';
      chainId: CaipChainId;
      status: Status;
      timestamp: number;
      data: {
        tokenSymbol?: string;
      };
    }
  | {
      type: 'contractInteraction';
      chainId: CaipChainId;
      status: Status;
      timestamp: number;
      data: {
        from: string;
        methodId?: string;
        to: string;
        transactionCategory?: string;
        transactionProtocol?: string;
        transactionType?: string;
      };
    };
