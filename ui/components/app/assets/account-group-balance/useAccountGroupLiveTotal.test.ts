import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  getAssetsBySelectedAccountGroup,
  selectUnifiedBalanceBySelectedAccountGroup,
} from '../../../../selectors/assets';
import { getAllEnabledNetworksForAllNamespaces } from '../../../../selectors/multichain/networks';
import { liveFiatDelta } from '../../../../hooks/assets/market-stats';
import { useAccountGroupLiveTotal } from './useAccountGroupLiveTotal';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('../../../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
  selectUnifiedBalanceBySelectedAccountGroup: jest.fn(),
}));
jest.mock('../../../../selectors/multichain/networks', () => ({
  getAllEnabledNetworksForAllNamespaces: jest.fn(),
}));
jest.mock('../../../../hooks/assets/market-stats', () => ({
  useMarketStats: jest.fn(() => new Map()),
  liveFiatDelta: jest.fn(),
}));

const ETH_ASSET = { assetId: 'eth-asset', chainId: '0x1' };
const POLYGON_ASSET = { assetId: 'pol-asset', chainId: '0x89' };

describe('useAccountGroupLiveTotal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(liveFiatDelta).mockImplementation((assets) => assets.length);

    const selectorValues = new Map<unknown, unknown>([
      [
        selectUnifiedBalanceBySelectedAccountGroup,
        { totalBalanceInUserCurrency: 100, userCurrency: 'usd' },
      ],
      [
        getAssetsBySelectedAccountGroup,
        { '0x1': [ETH_ASSET], '0x89': [POLYGON_ASSET] },
      ],
      [getAllEnabledNetworksForAllNamespaces, ['0x1']],
    ]);
    jest
      .mocked(useSelector)
      .mockImplementation((selector) => selectorValues.get(selector));
  });

  it('applies the live delta only to assets on enabled networks', () => {
    const { result } = renderHook(() => useAccountGroupLiveTotal());

    expect(liveFiatDelta).toHaveBeenCalledWith(
      [ETH_ASSET],
      expect.anything(),
      expect.any(Function),
    );
    expect(result.current.total).toBe(101);
  });

  it('returns undefined total until a polled balance exists', () => {
    jest.mocked(useSelector).mockImplementation((selector) => {
      if (selector === selectUnifiedBalanceBySelectedAccountGroup) {
        return null;
      }
      return selector === getAllEnabledNetworksForAllNamespaces ? ['0x1'] : {};
    });

    const { result } = renderHook(() => useAccountGroupLiveTotal());

    expect(result.current.total).toBeUndefined();
    expect(result.current.hasBalance).toBe(false);
  });
});
