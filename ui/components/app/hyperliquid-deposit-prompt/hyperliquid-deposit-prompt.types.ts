export type HyperliquidDepositPromptResult =
  | { action: 'continue'; transactionId: string }
  | { action: 'dismiss' };

export type HyperliquidDepositPromptProps = {
  onActionComplete: (result: HyperliquidDepositPromptResult) => void;
};
