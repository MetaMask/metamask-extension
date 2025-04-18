import React from 'react';
import {
  RequestStatus,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
import { mockNetworkState } from '../../../../test/stub/networks';
import { BridgeQuoteCard } from './bridge-quote-card';

describe('BridgeQuoteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the recommended quote', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          maxRefreshCount: 5,
          refreshRate: 30000,
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
      },
      bridgeStateOverrides: {
        quoteRequest: { insufficientBal: false },
        quotesRefreshCount: 1,
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
      },
    });
    const { container } = renderWithProvider(
      <BridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should render the recommended quote while loading new quotes', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: false, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
            [CHAIN_IDS.POLYGON]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        getQuotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.LOADING,
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
      },
    });
    const { container, queryByText } = renderWithProvider(
      <BridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('New quotes in')).not.toBeInTheDocument();
  });

  it('should not render when there is no quote', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: 1 },
      bridgeStateOverrides: {
        quotes: [],
        getQuotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { container } = renderWithProvider(
      <BridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should not render when there is a quote fetch error', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: 1 },
      bridgeStateOverrides: {
        quotes: [],
        getQuotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.ERROR,
      },
    });
    const { container } = renderWithProvider(
      <BridgeQuoteCard />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });
});
