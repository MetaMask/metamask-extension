import { QuoteStreamCompleteReason } from '@metamask/bridge-controller';
import { getQuoteStreamReasonString } from './getQuoteStreamReasonString';

describe('getQuoteStreamReasonString', () => {
  it('returns the retry key for RETRY', () => {
    expect(getQuoteStreamReasonString(QuoteStreamCompleteReason.RETRY)).toBe(
      'bridge_quote_stream_complete_retry',
    );
  });

  it('returns the amount too high key for AMOUNT_TOO_HIGH', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.AMOUNT_TOO_HIGH),
    ).toBe('bridge_quote_stream_complete_amount_too_high');
  });

  it('returns the amount too low key for AMOUNT_TOO_LOW', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.AMOUNT_TOO_LOW),
    ).toBe('bridge_quote_stream_complete_amount_too_low');
  });

  it('returns the slippage too high key for SLIPPAGE_TOO_HIGH', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.SLIPPAGE_TOO_HIGH),
    ).toBe('bridge_quote_stream_complete_slippage_too_high');
  });

  it('returns the slippage too low key for SLIPPAGE_TOO_LOW', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.SLIPPAGE_TOO_LOW),
    ).toBe('bridge_quote_stream_complete_slippage_too_low');
  });

  it('returns the token not supported key for TOKEN_NOT_SUPPORTED', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.TOKEN_NOT_SUPPORTED),
    ).toBe('bridge_quote_stream_complete_token_not_supported');
  });

  it('returns the geo restricted key for RWA_GEO_RESTRICTED', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.RWA_GEO_RESTRICTED),
    ).toBe('bridge_quote_stream_complete_rwa_geo_restricted');
  });

  it('returns the native token unsupported key for RWA_NATIVE_TOKEN_UNSUPPORTED', () => {
    expect(
      getQuoteStreamReasonString(
        QuoteStreamCompleteReason.RWA_NATIVE_TOKEN_UNSUPPORTED,
      ),
    ).toBe('bridge_quote_stream_complete_rwa_native_token_unsupported');
  });

  it('returns the market unavailable key for RWA_MARKET_UNAVAILABLE', () => {
    expect(
      getQuoteStreamReasonString(
        QuoteStreamCompleteReason.RWA_MARKET_UNAVAILABLE,
      ),
    ).toBe('bridge_quote_stream_complete_rwa_market_unavailable');
  });

  it('returns the retry key as the default for unknown reasons', () => {
    const unknownReason = 'UNKNOWN_REASON' as QuoteStreamCompleteReason;
    expect(getQuoteStreamReasonString(unknownReason)).toBe(
      'bridge_quote_stream_complete_retry',
    );
  });
});
