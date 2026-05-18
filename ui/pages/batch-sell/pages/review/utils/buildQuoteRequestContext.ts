import BigNumber from 'bignumber.js';
import { safeAmountForCalc } from '../../../../bridge/utils/quote';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { ReceivedAsset, QuoteRequestContext } from '../types';

// Mirrors `fromAmountInCurrency.usd.toNumber()` from the bridge prepare page,
// derived per-entry as `balance * (sendAmountPercent / 100) * tokenFiatPrice`.
// Returns `0` when balance or price is missing so the metrics field stays
// numeric.
export const computeUsdAmountSource = ({
  asset,
  sendAmountPercent,
}: {
  asset: BatchSellAsset;
  sendAmountPercent: number;
}): number => {
  if (!asset.balance || !asset.tokenFiatPrice) {
    return 0;
  }
  return new BigNumber(safeAmountForCalc(asset.balance))
    .times(sendAmountPercent)
    .div(100)
    .times(asset.tokenFiatPrice.toString())
    .toNumber();
};

// Batch-sell does not yet wire a Blockaid-style security scan into the review
// flow, so `security_warnings` defaults to `[]`. All other fields are sourced
// from data already available at the call site.
export const buildQuoteRequestContext = ({
  sourceAsset,
  receivedAsset,
  sendAmountPercent,
  smartTransactionsEnabled,
}: {
  sourceAsset: BatchSellAsset | undefined;
  receivedAsset: ReceivedAsset;
  sendAmountPercent: number;
  smartTransactionsEnabled: boolean;
}): QuoteRequestContext => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  stx_enabled: smartTransactionsEnabled,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  usd_amount_source: sourceAsset
    ? computeUsdAmountSource({ asset: sourceAsset, sendAmountPercent })
    : 0,
  // TODO: WIRE UP BEFORE LAUNCH ONCE METRICS FOR BATCH SELL IS ENABLED
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  security_warnings: [],
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token_symbol_source: sourceAsset?.symbol ?? '',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token_symbol_destination: receivedAsset.symbol,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token_security_type_destination: receivedAsset.securityData?.type ?? null,
});
