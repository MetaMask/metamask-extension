import { QuoteStreamCompleteReason } from '@metamask/bridge-controller';
import { getQuoteStreamReasonString } from './quote-stream';

describe('getQuoteStreamReasonString', () => {
  it('returns the retry key for RETRY', () => {
    expect(getQuoteStreamReasonString(QuoteStreamCompleteReason.RETRY)).toBe(
      'bridgeQuoteStreamCompleteRetry',
    );
  });

  it('returns the amount too high key for AMOUNT_TOO_HIGH', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.AMOUNT_TOO_HIGH),
    ).toBe('bridgeQuoteStreamCompleteAmountTooHigh');
  });

  it('returns the amount too low key for AMOUNT_TOO_LOW', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.AMOUNT_TOO_LOW),
    ).toBe('bridgeQuoteStreamCompleteAmountTooLow');
  });

  it('returns the slippage too high key for SLIPPAGE_TOO_HIGH', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.SLIPPAGE_TOO_HIGH),
    ).toBe('bridgeQuoteStreamCompleteSlippageTooHigh');
  });

  it('returns the slippage too low key for SLIPPAGE_TOO_LOW', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.SLIPPAGE_TOO_LOW),
    ).toBe('bridgeQuoteStreamCompleteSlippageTooLow');
  });

  it('returns the token not supported key for TOKEN_NOT_SUPPORTED', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.TOKEN_NOT_SUPPORTED),
    ).toBe('bridgeQuoteStreamCompleteTokenNotSupported');
  });

  it('returns the geo restricted key for RWA_GEO_RESTRICTED', () => {
    expect(
      getQuoteStreamReasonString(QuoteStreamCompleteReason.RWA_GEO_RESTRICTED),
    ).toBe('bridgeQuoteStreamCompleteRwaGeoRestricted');
  });

  it('returns the native token unsupported key for RWA_NATIVE_TOKEN_UNSUPPORTED', () => {
    expect(
      getQuoteStreamReasonString(
        QuoteStreamCompleteReason.RWA_NATIVE_TOKEN_UNSUPPORTED,
      ),
    ).toBe('bridgeQuoteStreamCompleteRwaNativeTokenUnsupported');
  });

  it('returns the market unavailable key for RWA_MARKET_UNAVAILABLE', () => {
    expect(
      getQuoteStreamReasonString(
        QuoteStreamCompleteReason.RWA_MARKET_UNAVAILABLE,
      ),
    ).toBe('bridgeQuoteStreamCompleteRwaMarketUnavailable');
  });

  it('returns the retry key as the default for unknown reasons', () => {
    const unknownReason = 'UNKNOWN_REASON' as QuoteStreamCompleteReason;
    expect(getQuoteStreamReasonString(unknownReason)).toBe(
      'bridgeQuoteStreamCompleteRetry',
    );
  });
});
