import {
  QuoteStreamCompleteReason,
  TokenFeatureType,
} from '@metamask/bridge-controller';
import { type BridgeAlert } from '../prepare/types';

export const getQuoteStreamReasonString = (
  reason: QuoteStreamCompleteReason,
): string => {
  switch (reason) {
    case QuoteStreamCompleteReason.RETRY:
      return 'bridgeQuoteStreamCompleteRetry';
    case QuoteStreamCompleteReason.AMOUNT_TOO_HIGH:
      return 'bridgeQuoteStreamCompleteAmountTooHigh';
    case QuoteStreamCompleteReason.AMOUNT_TOO_LOW:
      return 'bridgeQuoteStreamCompleteAmountTooLow';
    case QuoteStreamCompleteReason.SLIPPAGE_TOO_HIGH:
      return 'bridgeQuoteStreamCompleteSlippageTooHigh';
    case QuoteStreamCompleteReason.SLIPPAGE_TOO_LOW:
      return 'bridgeQuoteStreamCompleteSlippageTooLow';
    case QuoteStreamCompleteReason.TOKEN_NOT_SUPPORTED:
      return 'bridgeQuoteStreamCompleteTokenNotSupported';
    case QuoteStreamCompleteReason.RWA_GEO_RESTRICTED:
      return 'bridgeQuoteStreamCompleteRwaGeoRestricted';
    case QuoteStreamCompleteReason.RWA_NATIVE_TOKEN_UNSUPPORTED:
      return 'bridgeQuoteStreamCompleteRwaNativeTokenUnsupported';
    case QuoteStreamCompleteReason.RWA_MARKET_UNAVAILABLE:
      return 'bridgeQuoteStreamCompleteRwaMarketUnavailable';
    default:
      return 'bridgeQuoteStreamCompleteRetry';
  }
};
