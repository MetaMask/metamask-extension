import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { isSolanaChainId } from '@metamask/bridge-controller';
import configureStore from '../../../store/store';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import useRamps, { RampsMetaMaskEntry } from './useRamps';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  isSolanaChainId: jest.fn(),
}));

const mockedMetametricsId = '0xtestMetaMetricsId';

let mockStoreState = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    metaMetricsId: mockedMetametricsId,
  },
};

const wrapper: FC = ({ children }) => (
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

  it('should default the metamask entry param when opening the buy crypto URL', () => {
    const metaMaskEntry = 'ext_buy_sell_button';
    const mockChainId = '1';

    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        ...mockNetworkState({ chainId: '0x1' }),
      },
    };

    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=${mockChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const { result } = renderHook(() => useRamps(), { wrapper });

    result.current.openBuyCryptoInPdapp();
    expect(openTabSpy).toHaveBeenCalledWith({
      url: mockBuyURI,
    });
  });

  it('should use the correct metamask entry param when opening the buy crypto URL', () => {
    const metaMaskEntry = 'ext_buy_banner_tokens';
    const mockChainId = '1';

    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        ...mockNetworkState({ chainId: '0x1' }),
      },
    };

    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=${mockChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const { result } = renderHook(
      () => useRamps(RampsMetaMaskEntry.TokensBanner),
      { wrapper },
    );

    result.current.openBuyCryptoInPdapp();
    expect(openTabSpy).toHaveBeenCalledWith({
      url: mockBuyURI,
    });
  });

  it('should return the default URL when an invalid URL is provided', () => {
    jest.resetModules();

    const originalPortfolioUrl = process.env.PORTFOLIO_URL;
    process.env = { PORTFOLIO_URL: 'invalid-url' };

    const { result } = renderHook(() => useRamps(), { wrapper });

    const buyURI = result.current.getBuyURI('0x1');
    expect(buyURI).toBe('https://portfolio.metamask.io/buy');

    process.env.PORTFOLIO_URL = originalPortfolioUrl;
    jest.resetModules();
  });

  it('should handle Solana chain IDs correctly', () => {
    const metaMaskEntry = 'ext_buy_sell_button';
    const solanaChainId = 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ';
    (isSolanaChainId as jest.Mock).mockReturnValueOnce(true);
    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        // @ts-expect-error ignore the 0xString interface check
        ...mockNetworkState({ chainId: solanaChainId }),
      },
    };
    const encodedChainId = encodeURIComponent(solanaChainId);
    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=${encodedChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    const { result } = renderHook(() => useRamps(), { wrapper });
    const buyURI = result.current.getBuyURI(solanaChainId);
    expect(buyURI).toBe(mockBuyURI);
  });
});
