import React from 'react';
import { RequestStatus } from '@metamask/bridge-controller';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { BridgeQuotesModal } from './bridge-quotes-modal';

describe('BridgeQuotesModal', () => {
  it('should render the modal', () => {
    const mockStore = createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
      bridgeSliceOverrides: {
        fromTokenExchangeRate: 1,
        toTokenExchangeRate: 0.99,
      },
      metamaskStateOverrides: {
        currencyRates: {
          ETH: {
            conversionRate: 1,
          },
          POL: {
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        ...mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.LINEA_MAINNET },
          { chainId: CHAIN_IDS.POLYGON },
          { chainId: CHAIN_IDS.OPTIMISM },
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
