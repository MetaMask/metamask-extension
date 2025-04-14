// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { Hex } from '@metamask/utils';
import configureStore from '../../../store/store';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import useRamps, { RampsMetaMaskEntry } from './useRamps';

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
  // mock the openTab function to test if it is called with the correct URL when opening the Pdapp
  beforeAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    Object.defineProperty(global, 'platform', {
      value: {
        openTab: jest.fn(),
      },
    });
  });

  it('should default the metamask entry param when opening the buy crypto URL', () => {
    const metaMaskEntry = 'ext_buy_sell_button';
    const mockChainId = '0x1';

    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        ...mockNetworkState({ chainId: mockChainId }),
      },
    };

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=${mockChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    const openTabSpy = jest.spyOn(global.platform, 'openTab');

    const { result } = renderHook(() => useRamps(), { wrapper }); // default metamask entry

    result.current.openBuyCryptoInPdapp();
    expect(openTabSpy).toHaveBeenCalledWith({
      url: mockBuyURI,
    });
  });

  it('should use the correct metamask entry param when opening the buy crypto URL', () => {
    const metaMaskEntry = 'ext_buy_banner_tokens';
    const mockChainId = '0x1';

    mockStoreState = {
      ...mockStoreState,
      metamask: {
        ...mockStoreState.metamask,
        ...mockNetworkState({ chainId: mockChainId }),
      },
    };

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=${metaMaskEntry}&chainId=${mockChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
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

  it.each(['0x1', '0x38', '0xa'] as Hex[])(
    'should open the buy crypto URL with the currently connected chain ID',
    (mockChainId: Hex) => {
      mockStoreState = {
        ...mockStoreState,
        metamask: {
          ...mockStoreState.metamask,
          ...mockNetworkState({ chainId: mockChainId }),
        },
      };

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=ext_buy_sell_button&chainId=${mockChainId}&metametricsId=${mockedMetametricsId}&metricsEnabled=false`;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      const openTabSpy = jest.spyOn(global.platform, 'openTab');
      const { result } = renderHook(() => useRamps(), { wrapper });

      result.current.openBuyCryptoInPdapp();

      expect(openTabSpy).toHaveBeenCalledWith({
        url: mockBuyURI,
      });
    },
  );
  it('should return the default URL when an invalid URL is provided', () => {
    jest.resetModules();

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    const originalPortfolioUrl = process.env.PORTFOLIO_URL;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env = { PORTFOLIO_URL: 'invalid-url' };

    const { result } = renderHook(() => useRamps(), { wrapper });

    const buyURI = result.current.getBuyURI('0x1');
    expect(buyURI).toBe('https://portfolio.metamask.io/buy');

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.PORTFOLIO_URL = originalPortfolioUrl;
    jest.resetModules();
  });
});
