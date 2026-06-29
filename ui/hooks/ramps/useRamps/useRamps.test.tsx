import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import configureStore from '../../../store/store';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { RAMPS_ROUTE } from '../../../helpers/constants/routes';
import useRamps, { RampsMetaMaskEntry } from './useRamps';

jest.mock('../../../../shared/lib/asset-utils', () => ({
  ...jest.requireActual('../../../../shared/lib/asset-utils'),
  isEvmChainId: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockedMetametricsId = '0xtestMetaMetricsId';

let mockStoreState = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    analyticsId: mockedMetametricsId,
  },
};

const wrapper = ({ children }: React.PropsWithChildren<unknown>) => (
  <Provider store={configureStore(mockStoreState)}>{children}</Provider>
);

describe('useRamps', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
  });

  it('should pass the numeric version of the chain ID', () => {
    const testCases = [
      { mockChainId: '0x1', numericChainId: '1' },
      { mockChainId: '0x38', numericChainId: '56' },
    ];

    testCases.forEach(({ mockChainId, numericChainId }) => {
      (isEvmChainId as jest.Mock).mockReturnValueOnce(true);
      mockStoreState = {
        ...mockStoreState,
        metamask: {
          ...mockStoreState.metamask,
          // @ts-expect-error ignore the 0xString interface check
          ...mockNetworkState({ chainId: mockChainId }),
        },
      };

      const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=ext_buy_sell_button&chainId=${numericChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;

      const { result } = renderHook(() => useRamps(), { wrapper });

      // @ts-expect-error ignore the 0xString interface check
      const buyURI = result.current.getBuyURI(mockChainId);
      expect(buyURI).toBe(mockBuyURI);
    });
  });

  it('navigates to the in-extension ramps route when opening buy crypto', () => {
    mockNavigate.mockClear();

    const { result } = renderHook(() => useRamps(), { wrapper });

    result.current.openBuyCryptoInPdapp();
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_ROUTE);
  });

  it('navigates to the ramps route regardless of the metamask entry', () => {
    mockNavigate.mockClear();

    const { result } = renderHook(
      () => useRamps(RampsMetaMaskEntry.TokensBanner),
      { wrapper },
    );

    result.current.openBuyCryptoInPdapp();
    expect(mockNavigate).toHaveBeenCalledWith(RAMPS_ROUTE);
  });

  it('should return the default URL when an invalid URL is provided', () => {
    jest.resetModules();

    const originalPortfolioUrl = process.env.PORTFOLIO_URL;
    process.env = { PORTFOLIO_URL: 'invalid-url' };

    const { result } = renderHook(() => useRamps(), { wrapper });

    const buyURI = result.current.getBuyURI('0x1');
    expect(buyURI).toBe('https://app.metamask.io/buy');

    process.env.PORTFOLIO_URL = originalPortfolioUrl;
    jest.resetModules();
  });

  it('should handle EVM chain IDs correctly by converting to numeric format', () => {
    const metaMaskEntry = 'ext_buy_sell_button';
    const evmChainId = '0x1';
    (isEvmChainId as jest.Mock).mockReturnValueOnce(true);
    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        ...mockNetworkState({ chainId: evmChainId }),
      },
    };
    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=1&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    const { result } = renderHook(() => useRamps(), { wrapper });
    const buyURI = result.current.getBuyURI(evmChainId);
    expect(buyURI).toBe(mockBuyURI);
  });

  it('should handle non-EVM chain IDs correctly (like Bitcoin)', () => {
    const metaMaskEntry = 'ext_buy_sell_button';
    const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93';
    (isEvmChainId as jest.Mock).mockReturnValueOnce(false);
    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        // @ts-expect-error ignore the 0xString interface check
        ...mockNetworkState({ chainId: bitcoinChainId }),
      },
    };
    const encodedChainId = encodeURIComponent(bitcoinChainId);
    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=${encodedChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    const { result } = renderHook(() => useRamps(), { wrapper });
    const buyURI = result.current.getBuyURI(bitcoinChainId);
    expect(buyURI).toBe(mockBuyURI);
  });
});
