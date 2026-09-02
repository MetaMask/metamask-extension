export type RampsCompleteBuyLocationState = {
  checkoutUrl: string;
  providerName: string;
  amountOut?: number | string;
  tokenSymbol: string;
  tokenIconUrl?: string;
  tokenChainId?: string;
  paymentMethodLabel: string;
  walletAddress: string;
  createdAt: number;
};
