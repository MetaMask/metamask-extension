import { QuoteStreamCompleteReason } from '@metamask/bridge-controller';

export const getQuoteStreamReasonString = (
  reason: QuoteStreamCompleteReason,
): string => {
  switch (reason) {
    case QuoteStreamCompleteReason.RETRY:
      return 'bridge_quote_stream_complete_retry'
    case QuoteStreamCompleteReason.AMOUNT_TOO_HIGH:
      return 'bridge_quote_stream_complete_amount_too_high'
    case QuoteStreamCompleteReason.AMOUNT_TOO_LOW:
      return 'bridge_quote_stream_complete_amount_too_low'
    case QuoteStreamCompleteReason.SLIPPAGE_TOO_HIGH:
      return 'bridge_quote_stream_complete_slippage_too_high'
    case QuoteStreamCompleteReason.SLIPPAGE_TOO_LOW:
      return 'bridge_quote_stream_complete_slippage_too_low'
    case QuoteStreamCompleteReason.TOKEN_NOT_SUPPORTED:
      return 'bridge_quote_stream_complete_token_not_supported'
    case QuoteStreamCompleteReason.RWA_GEO_RESTRICTED:
      return 'bridge_quote_stream_complete_rwa_geo_restricted'
    case QuoteStreamCompleteReason.RWA_NATIVE_TOKEN_UNSUPPORTED:
      return 'bridge_quote_stream_complete_rwa_native_token_unsupported'
    case QuoteStreamCompleteReason.RWA_MARKET_UNAVAILABLE:
      return 'bridge_quote_stream_complete_rwa_market_unavailable'
    default:
      return 'bridge_quote_stream_complete_retry'
  }
};
