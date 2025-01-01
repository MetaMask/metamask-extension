import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
import { RequestStatus } from '../../../../shared/types/bridge';
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
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: 1 },
      bridgeStateOverrides: {
        quoteRequest: { insufficientBal: false },
        quotesRefreshCount: 1,
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
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
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: true },
          },
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: 1 },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        getQuotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.LOADING,
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
