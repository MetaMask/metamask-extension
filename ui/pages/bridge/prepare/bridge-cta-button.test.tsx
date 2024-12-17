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
    });
    const { container, getByText } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Select token')).toBeInTheDocument();
  });

  it('should render the component when amount is missing', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: null,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
    });
    const { getByText } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Select amount')).toBeInTheDocument();
  });

  it('should render the component when amount and dest token is missing', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: null,
        fromToken: 'ETH',
        toToken: null,
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
    });
    const { getByText, container } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Select token and amount')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should render the component when tx is submittable', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.OPTIMISM]: { isActiveSrc: true, isActiveDest: false },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Submit')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });

  it('should disable the component when quotes are loading and there are no existing quotes', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.OPTIMISM]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      bridgeStateOverrides: {
        quotes: [],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { container } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();
  });

  it('should enable the component when quotes are loading and there are existing quotes', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        extensionConfig: {
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.OPTIMISM]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: 1,
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: CHAIN_IDS.LINEA_MAINNET,
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { getByText, getByRole, container } = renderWithProvider(
      <BridgeCTAButton />,
      configureStore(mockStore),
    );

    expect(getByText('Submit')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
    expect(container).toMatchSnapshot();
  });
});
