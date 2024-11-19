import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { RequestStatus } from '../../../../app/scripts/controllers/bridge/constants';
import { BridgeCTAButton } from './bridge-cta-button';

describe('BridgeCTAButton', () => {
  it("should render the component's initial state", () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.OPTIMISM],
      },
      { fromTokenInputValue: 1 },
    );
    const { container, getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Select token')).toBeInTheDocument();
    expect(getByRole('button')).toBeDisabled();
  });

  it('should render the component when amount is missing', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: null,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {},
    );
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Enter amount')).toBeInTheDocument();
    expect(getByRole('button')).toBeDisabled();
  });

  it('should render the component when amount and dest token is missing', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: null,
        fromToken: 'ETH',
        toToken: null,
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {},
    );
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Select token and amount')).toBeInTheDocument();
    expect(getByRole('button')).toBeDisabled();
  });

  it('should render the component when tx is submittable', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {
        quotes: mockBridgeQuotesNativeErc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    );
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });

  it('should disable the component when quotes are loading and there are no existing quotes', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {
        quotes: [],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    );
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Fetching quotes...')).toBeInTheDocument();
    expect(getByRole('button')).toBeDisabled();
  });

  it('should enable the component when quotes are loading and there are existing quotes', () => {
    const mockStore = createBridgeMockStore(
      {
        srcNetworkAllowlist: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
        destNetworkAllowlist: [CHAIN_IDS.LINEA_MAINNET],
      },
      {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {
        quotes: mockBridgeQuotesNativeErc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    );
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });
});
