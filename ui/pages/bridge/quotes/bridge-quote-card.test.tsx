import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { RequestStatus } from '../../../../app/scripts/controllers/bridge/constants';
import { BridgeQuoteCard } from './bridge-quote-card';

describe('BridgeQuoteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the recommended quote', async () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
        extensionConfig: { maxRefreshCount: 5, refreshRate: 30000 },
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
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
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
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
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
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
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
