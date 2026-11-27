import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { marketStatsQueryKey, type LivePriceMap } from '@metamask/core-backend';

import { getAccountGroupLiveTotalState } from '#ui/selectors/assets';
import { liveFiatDelta, useMarketStats } from '#ui/hooks/assets/market-stats';
import { useAccountGroupLiveTotal } from '#ui/hooks/assets/use-account-group-live-total';
import { assetToCaipId } from '#shared/lib/asset-utils';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('#ui/selectors/assets', () => ({
  getAccountGroupLiveTotalState: jest.fn(),
}));
jest.mock('#ui/hooks/assets/market-stats', () => ({
  useMarketStats: jest.fn(),
  liveFiatDelta: jest.fn(),
  useMarketStatsListener: jest.fn(),
}));

const ETH_ASSET = { assetId: 'eth-asset', chainId: '0x1' };

describe('useAccountGroupLiveTotal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculates live total from polled balance and live delta', () => {
    const mockQuotes: LivePriceMap = new Map([
      ['eip155:1/slip44:60', { price: 150 }],
    ]);

    jest.mocked(useSelector).mockReturnValue({
      assets: [ETH_ASSET],
      polledTotal: 100,
      currency: 'usd',
      hasBalance: true,
    });
    jest.mocked(useMarketStats).mockReturnValue(mockQuotes);
    jest.mocked(liveFiatDelta).mockReturnValue(5);

    const { result } = renderHook(() => useAccountGroupLiveTotal());

    expect(result.current.total).toBe(105);
    expect(result.current.currency).toBe('usd');
    expect(result.current.hasBalance).toBe(true);
    expect(liveFiatDelta).toHaveBeenCalledWith(
      [ETH_ASSET],
      mockQuotes,
      assetToCaipId,
    );
  });

  it('returns undefined total until a polled balance exists', () => {
    const mockQuotes: LivePriceMap = new Map();

    jest.mocked(useSelector).mockReturnValue({
      assets: [],
      polledTotal: undefined,
      currency: undefined,
      hasBalance: false,
    });
    jest.mocked(useMarketStats).mockReturnValue(mockQuotes);

    const { result } = renderHook(() => useAccountGroupLiveTotal());

    expect(result.current.total).toBeUndefined();
    expect(result.current.hasBalance).toBe(false);
  });
});
