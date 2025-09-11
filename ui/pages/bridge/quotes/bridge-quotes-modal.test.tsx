import React from 'react';
import { RequestStatus } from '@metamask/bridge-controller';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { BridgeQuotesModal } from './bridge-quotes-modal';

describe('BridgeQuotesModal', () => {
  it('should render the modal', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            '0x1': { isActiveSrc: true, isActiveDest: false },
            '0xa': { isActiveSrc: true, isActiveDest: false },
            '0x89': { isActiveSrc: false, isActiveDest: true },
          },
        },
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
        quoteRequest: {
          srcChainId: 10,
          destChainId: 137,
          srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          srcTokenAmount: '14000000',
        },
      },
      metamaskStateOverrides: {
        marketData: {
          '0xa': {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': {
              currency: 'ETH',
              price: 1,
            },
          },
          '0x89': {
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
              currency: 'POL',
              price: 0.99,
            },
          },
        },
        currencyRates: {
          ETH: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.OPTIMISM },
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.LINEA_MAINNET },
          { chainId: CHAIN_IDS.POLYGON },
        ),
      },
    });

    const { baseElement } = renderWithProvider(
      <BridgeQuotesModal
        isOpen={true}
        onClose={() => {
          console.log('close');
        }}
      />,
      configureStore(mockStore),
    );

    expect(baseElement).toMatchSnapshot();
  });
});
