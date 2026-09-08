import { renderHook, waitFor } from '@testing-library/react';
import type { MarketInfo } from '@metamask/perps-controller';
import {
  getIsPerpsExperienceAvailable,
  getIsPerpsTerminalBackendEnabled,
} from '../../../selectors/perps';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  clearAssetPerpsMarketCache,
  useAssetPerpsMarket,
} from './useAssetPerpsMarket';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const ETH_MARKET = { name: 'ETH' } as MarketInfo;

function mockPerpsAvailability({
  isAvailable,
  useTerminalApi = false,
}: {
  isAvailable: boolean;
  useTerminalApi?: boolean;
}) {
  mockUseSelector.mockImplementation((selector) => {
    if (selector === getIsPerpsExperienceAvailable) {
      return isAvailable;
    }
    if (selector === getIsPerpsTerminalBackendEnabled) {
      return useTerminalApi;
    }
    return undefined;
  });
}

describe('useAssetPerpsMarket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAssetPerpsMarketCache();
  });

  it('returns loading until the targeted market lookup resolves', () => {
    mockPerpsAvailability({ isAvailable: true });
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    expect(result.current).toStrictEqual({
      market: undefined,
      isLoading: true,
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetMarkets',
      [{ symbols: ['ETH'], standalone: true, useTerminalApi: false }],
    );
  });

  it('returns the matching market after the targeted lookup resolves', async () => {
    mockPerpsAvailability({ isAvailable: true });
    mockSubmitRequestToBackground.mockResolvedValue([
      { name: 'BTC' },
      ETH_MARKET,
    ]);

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    await waitFor(() => {
      expect(result.current).toStrictEqual({
        market: ETH_MARKET,
        isLoading: false,
      });
    });
  });

  it('matches the market symbol case-insensitively', async () => {
    mockPerpsAvailability({ isAvailable: true });
    mockSubmitRequestToBackground.mockResolvedValue([{ name: 'eth' }]);

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    await waitFor(() => {
      expect(result.current.market).toStrictEqual({ name: 'eth' });
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns no market once the lookup finds none', async () => {
    mockPerpsAvailability({ isAvailable: true });
    mockSubmitRequestToBackground.mockResolvedValue([{ name: 'BTC' }]);

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    await waitFor(() => {
      expect(result.current).toStrictEqual({
        market: undefined,
        isLoading: false,
      });
    });
  });

  it('does not cache a rejected lookup so a later visit retries', async () => {
    mockPerpsAvailability({ isAvailable: true });
    mockSubmitRequestToBackground
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce([ETH_MARKET]);

    const firstVisit = renderHook(() => useAssetPerpsMarket('ETH'));

    await waitFor(() => {
      expect(firstVisit.result.current).toStrictEqual({
        market: undefined,
        isLoading: false,
      });
    });

    firstVisit.unmount();

    const secondVisit = renderHook(() => useAssetPerpsMarket('ETH'));

    await waitFor(() => {
      expect(secondVisit.result.current).toStrictEqual({
        market: ETH_MARKET,
        isLoading: false,
      });
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
  });

  it('reuses a successful miss on a later visit', async () => {
    mockPerpsAvailability({ isAvailable: true });
    mockSubmitRequestToBackground.mockResolvedValue([{ name: 'BTC' }]);

    const firstVisit = renderHook(() => useAssetPerpsMarket('ETH'));

    await waitFor(() => {
      expect(firstVisit.result.current.isLoading).toBe(false);
    });

    firstVisit.unmount();

    const secondVisit = renderHook(() => useAssetPerpsMarket('ETH'));

    expect(secondVisit.result.current).toStrictEqual({
      market: undefined,
      isLoading: false,
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
  });

  it('skips the lookup when the Perps experience is unavailable', () => {
    mockPerpsAvailability({ isAvailable: false });

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    expect(result.current).toStrictEqual({
      market: undefined,
      isLoading: false,
    });
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('forwards the terminal-backend flag on the targeted request', () => {
    mockPerpsAvailability({ isAvailable: true, useTerminalApi: true });
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));

    renderHook(() => useAssetPerpsMarket('ETH'));

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetMarkets',
      [{ symbols: ['ETH'], standalone: true, useTerminalApi: true }],
    );
  });
});
