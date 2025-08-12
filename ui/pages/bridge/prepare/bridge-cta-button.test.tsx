import React from 'react';
import {
  RequestStatus,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
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
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
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
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
    });
    const { getByText } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
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
        fromToken: {
          symbol: 'ETH',
          assetId: getNativeAssetForChainId(1).assetId,
        },
        toToken: null,
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
    });
    const { getByText, container } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(getByText('Select amount')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should render the component when amount, dest chain and dest token are missing (defaults set', () => {
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
        fromToken: {
          symbol: 'ETH',
          assetId: getNativeAssetForChainId(1).assetId,
        },
        toToken: null,
        toChainId: null,
      },
    });
    const { getByText, container } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(getByText('Select amount')).toBeInTheDocument();
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
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
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
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
      bridgeStateOverrides: {
        quotes: [],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { container } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
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
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { getByText, getByRole, container } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(getByText('Submit')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
    expect(container).toMatchSnapshot();
  });
});
