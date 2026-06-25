import { renderHook } from '@testing-library/react-hooks';
import { submitRequestToBackground } from '../../../store/background-connection';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsLiveOrderBook } from './usePerpsLiveOrderBook';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('./usePerpsChannel', () => ({
  usePerpsChannel: jest.fn(),
}));

const mockUsePerpsChannel = jest.mocked(usePerpsChannel);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('usePerpsLiveOrderBook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockUsePerpsChannel.mockReturnValue({
      data: null,
      isInitialLoading: false,
    });
  });

  it('activates and deactivates the background order-book stream by default', () => {
    const { unmount } = renderHook(() =>
      usePerpsLiveOrderBook({ symbol: 'BTC', levels: 10 }),
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsActivateOrderBookStream',
      [{ symbol: 'BTC', levels: 10, nSigFigs: undefined, mantissa: undefined }],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsDeactivateOrderBookStream',
      [],
    );
  });

  it('does not manage the stream when manageStream is false', () => {
    const { rerender, unmount } = renderHook(
      ({ enabled }) =>
        usePerpsLiveOrderBook({
          symbol: 'BTC',
          enabled,
          manageStream: false,
        }),
      { initialProps: { enabled: true } },
    );

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

    rerender({ enabled: false });
    unmount();

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('marks initial loading when disabled', () => {
    mockUsePerpsChannel.mockReturnValue({
      data: null,
      isInitialLoading: false,
    });

    const { result } = renderHook(() =>
      usePerpsLiveOrderBook({ symbol: 'BTC', enabled: false }),
    );

    expect(result.current.isInitialLoading).toBe(true);
  });
});
