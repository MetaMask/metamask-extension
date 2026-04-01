import { QuoteStreamCompleteReason } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getQuoteStreamComplete } from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBridgeUnavailableQuotesReason } from './useBridgeUnavailableQuotesReason';

jest.mock('../../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../../ducks/bridge/selectors'),
  getQuoteStreamComplete: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext');

const mockT = jest.fn((key: string) => key);

const mockGetQuoteStreamComplete = jest.mocked(getQuoteStreamComplete);
const mockUseI18nContext = jest.mocked(useI18nContext);

const renderHook = () =>
  renderHookWithProvider(() => useBridgeUnavailableQuotesReason(), {
    metamask: {},
  });

describe('useBridgeUnavailableQuotesReason', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT as never);
  });

  it('returns the generic fallback message when quoteStreamComplete is null', () => {
    mockGetQuoteStreamComplete.mockReturnValue(null);

    const { result } = renderHook();

    expect(mockT).toHaveBeenCalledWith('noOptionsAvailableMessage');
    expect(result.current).toBe('noOptionsAvailableMessage');
  });

  it('returns the generic fallback message when quoteStreamComplete has no reason', () => {
    mockGetQuoteStreamComplete.mockReturnValue({
      quoteCount: 2,
      hasQuotes: true,
    } as never);

    const { result } = renderHook();

    expect(mockT).toHaveBeenCalledWith('noOptionsAvailableMessage');
    expect(result.current).toBe('noOptionsAvailableMessage');
  });

  it('returns the generic fallback message when reason is undefined', () => {
    mockGetQuoteStreamComplete.mockReturnValue({
      quoteCount: 0,
      hasQuotes: false,
      reason: undefined,
    } as never);

    const { result } = renderHook();

    expect(mockT).toHaveBeenCalledWith('noOptionsAvailableMessage');
    expect(result.current).toBe('noOptionsAvailableMessage');
  });

  const reasonCases: [QuoteStreamCompleteReason, string][] = [
    [QuoteStreamCompleteReason.RETRY, 'bridge_quote_stream_complete_retry'],
    [
      QuoteStreamCompleteReason.AMOUNT_TOO_HIGH,
      'bridge_quote_stream_complete_amount_too_high',
    ],
    [
      QuoteStreamCompleteReason.AMOUNT_TOO_LOW,
      'bridge_quote_stream_complete_amount_too_low',
    ],
    [
      QuoteStreamCompleteReason.SLIPPAGE_TOO_HIGH,
      'bridge_quote_stream_complete_slippage_too_high',
    ],
    [
      QuoteStreamCompleteReason.SLIPPAGE_TOO_LOW,
      'bridge_quote_stream_complete_slippage_too_low',
    ],
    [
      QuoteStreamCompleteReason.TOKEN_NOT_SUPPORTED,
      'bridge_quote_stream_complete_token_not_supported',
    ],
    [
      QuoteStreamCompleteReason.RWA_GEO_RESTRICTED,
      'bridge_quote_stream_complete_rwa_geo_restricted',
    ],
    [
      QuoteStreamCompleteReason.RWA_NATIVE_TOKEN_UNSUPPORTED,
      'bridge_quote_stream_complete_rwa_native_token_unsupported',
    ],
    [
      QuoteStreamCompleteReason.RWA_MARKET_UNAVAILABLE,
      'bridge_quote_stream_complete_rwa_market_unavailable',
    ],
  ];

  reasonCases.forEach(([reason, expectedI18nKey]) => {
    it(`returns translated string for reason ${reason}`, () => {
      mockGetQuoteStreamComplete.mockReturnValue({
        quoteCount: 0,
        hasQuotes: false,
        reason,
      } as never);

      const { result } = renderHook();

      expect(mockT).toHaveBeenCalledWith(expectedI18nKey);
      expect(result.current).toBe(expectedI18nKey);
    });
  });
});
