import { renderHook } from '@testing-library/react-hooks';
import { useMusdConversionQuoteTrace } from './useMusdConversionQuoteTrace';

const mockTrace = jest.fn();
const mockEndTrace = jest.fn();

jest.mock('../../../../../shared/lib/trace', () => ({
  trace: (...args: unknown[]) => mockTrace(...args),
  endTrace: (...args: unknown[]) => mockEndTrace(...args),
  TraceName: { MusdConversionQuote: 'MusdConversionQuote' },
  TraceOperation: { MusdConversionDataFetch: 'musd.conversion.data_fetch' },
}));

const mockUseConfirmContext = jest.fn();
jest.mock('../../context/confirm', () => ({
  useConfirmContext: () => mockUseConfirmContext(),
}));

const mockUseTransactionPayToken = jest.fn();
jest.mock('../pay/useTransactionPayToken', () => ({
  useTransactionPayToken: () => mockUseTransactionPayToken(),
}));

const mockUseTransactionPayQuotes = jest.fn();
const mockUseIsTransactionPayLoading = jest.fn();
jest.mock('../pay/useTransactionPayData', () => ({
  useTransactionPayQuotes: () => mockUseTransactionPayQuotes(),
  useIsTransactionPayLoading: () => mockUseIsTransactionPayLoading(),
}));

describe('useMusdConversionQuoteTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: { id: 'tx-1' },
    });
    mockUseTransactionPayToken.mockReturnValue({
      payToken: { address: '0xUsdc', chainId: '0x1' },
    });
    mockUseTransactionPayQuotes.mockReturnValue(undefined);
    mockUseIsTransactionPayLoading.mockReturnValue(false);
  });

  it('does not start trace when not loading', () => {
    renderHook(() => useMusdConversionQuoteTrace());

    expect(mockTrace).not.toHaveBeenCalled();
  });

  it('starts trace when loading begins', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    expect(mockTrace).not.toHaveBeenCalled();

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionQuote',
        op: 'musd.conversion.data_fetch',
        tags: expect.objectContaining({
          transactionId: 'tx-1',
          payTokenAddress: '0xUsdc',
          payTokenChainId: '0x1',
        }),
      }),
    );
  });

  it('ends trace with success when quotes arrive', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(1);

    mockUseIsTransactionPayLoading.mockReturnValue(false);
    mockUseTransactionPayQuotes.mockReturnValue([{ strategy: 'lifi' }]);
    rerender();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionQuote',
        data: expect.objectContaining({
          success: true,
          quoteCount: 1,
          strategy: 'lifi',
        }),
      }),
    );
  });

  it('ends trace with failure when no quotes arrive', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    mockUseIsTransactionPayLoading.mockReturnValue(false);
    mockUseTransactionPayQuotes.mockReturnValue([]);
    rerender();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionQuote',
        data: expect.objectContaining({
          success: false,
          reason: 'no_quotes',
        }),
      }),
    );
  });

  it('uses "unknown" when pay token is missing', () => {
    mockUseTransactionPayToken.mockReturnValue({ payToken: undefined });
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          payTokenAddress: 'unknown',
          payTokenChainId: 'unknown',
        }),
      }),
    );
  });

  it('uses "unknown" when transaction ID is missing', () => {
    mockUseConfirmContext.mockReturnValue({ currentConfirmation: undefined });
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: expect.objectContaining({
          transactionId: 'unknown',
        }),
      }),
    );
  });

  it('does not start a second trace while one is active', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(1);

    // Stays loading
    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(1);
  });

  it('ends active trace on unmount', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender, unmount } = renderHook(() =>
      useMusdConversionQuoteTrace(),
    );

    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(1);
    expect(mockEndTrace).not.toHaveBeenCalled();

    unmount();

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MusdConversionQuote',
        data: expect.objectContaining({
          success: false,
          reason: 'unmounted',
        }),
      }),
    );
  });

  it('does not call endTrace on unmount when no trace is active', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { unmount } = renderHook(() => useMusdConversionQuoteTrace());

    unmount();

    expect(mockEndTrace).not.toHaveBeenCalled();
  });

  it('can start a new trace after a previous one completes', () => {
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const { rerender } = renderHook(() => useMusdConversionQuoteTrace());

    // First cycle
    mockUseIsTransactionPayLoading.mockReturnValue(true);
    rerender();

    mockUseIsTransactionPayLoading.mockReturnValue(false);
    mockUseTransactionPayQuotes.mockReturnValue([{ strategy: 'lifi' }]);
    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(1);
    expect(mockEndTrace).toHaveBeenCalledTimes(1);

    // Second cycle
    mockUseIsTransactionPayLoading.mockReturnValue(true);
    mockUseTransactionPayQuotes.mockReturnValue(undefined);
    rerender();

    expect(mockTrace).toHaveBeenCalledTimes(2);
  });
});
