import { renderHook } from '@testing-library/react';
import type { MarketInfo } from '@metamask/perps-controller';
import { getIsPerpsExperienceAvailable } from '../../../selectors/perps';
import { usePerpsMarketInfo } from '../../../hooks/perps/usePerpsMarketInfo';
import { useAssetPerpsMarket } from './useAssetPerpsMarket';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../../hooks/perps/usePerpsMarketInfo', () => ({
  usePerpsMarketInfo: jest.fn(),
}));
const mockUsePerpsMarketInfo = usePerpsMarketInfo as jest.MockedFunction<
  typeof usePerpsMarketInfo
>;

const ETH_MARKET = { name: 'ETH' } as MarketInfo;

describe('useAssetPerpsMarket', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the matching market when the Perps experience is available', () => {
    mockUseSelector.mockImplementation((selector) =>
      selector === getIsPerpsExperienceAvailable ? true : undefined,
    );
    mockUsePerpsMarketInfo.mockReturnValue(ETH_MARKET);

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    expect(result.current).toBe(ETH_MARKET);
    expect(mockUsePerpsMarketInfo).toHaveBeenCalledWith('ETH', {
      enabled: true,
    });
  });

  it('disables the market lookup when the Perps experience is unavailable', () => {
    mockUseSelector.mockImplementation((selector) =>
      selector === getIsPerpsExperienceAvailable ? false : undefined,
    );
    mockUsePerpsMarketInfo.mockReturnValue(undefined);

    const { result } = renderHook(() => useAssetPerpsMarket('ETH'));

    expect(result.current).toBeUndefined();
    expect(mockUsePerpsMarketInfo).toHaveBeenCalledWith('ETH', {
      enabled: false,
    });
  });
});
