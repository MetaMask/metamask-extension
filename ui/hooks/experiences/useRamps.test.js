import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import configureStore from '../../store/store';
import useRamps from './useRamps';

const mockedMetametricsId = '0xtestMetaMetricsId';

let mockStoreState = {
  metamask: {
    providerConfig: {
      chainId: '0x1',
    },
    metaMetricsId: mockedMetametricsId,
  },
};

const wrapper = ({ children }) => (
  <Provider store={configureStore(mockStoreState)}>{children}</Provider>
);

describe('useRamps', () => {
  beforeEach(() => {
    global.platform = { openTab: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  ['0x1', '0x38', '0xa'].forEach((mockChainId) => {
    it(`should open the buy crypto URL with the currently connected chain ID of ${mockChainId}`, () => {
      mockStoreState = {
        ...mockStoreState,
        metamask: {
          ...mockStoreState.metamask,
          providerConfig: {
            chainId: mockChainId,
          },
        },
      };

      const mockBuyURI = `${process.env.PORTFOLIO_URL}/buy?metamaskEntry=ext_buy_sell_button&chainId=${mockChainId}&metametricsId=${mockedMetametricsId}`;

      const openTabSpy = jest.spyOn(global.platform, 'openTab');

      const { result } = renderHook(() => useRamps(), { wrapper });

      result.current.openBuyCryptoInPdapp();
      expect(openTabSpy).toHaveBeenCalledWith({
        url: mockBuyURI,
      });
    });
  });
});
