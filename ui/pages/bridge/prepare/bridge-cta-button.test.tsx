import React from 'react';
import {
  QuoteResponse,
  RequestStatus,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
import * as bridgeSelectors from '../../../ducks/bridge/selectors';
import { BridgeCTAButton } from './bridge-cta-button';

describe('BridgeCTAButton', () => {
  it("should render the component's initial state", () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
          ],
        },
      },
      bridgeSliceOverrides: { fromTokenInputValue: '1' },
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
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
          ],
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: null,
        // fromToken: 'ETH',
        // toToken: 'ETH',
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
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
          ],
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
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
          ],
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
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
          ],
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(getByText('Swap')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });

  it('should disable the component when quotes are loading and there are no existing quotes', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
          ],
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
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

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    ['disable', 'there is a tx alert', { isTxAlertPresent: true }],
    [
      'disable',
      'there is insufficient gas for quote',
      { isInsufficientGasForQuote: true },
      'Insufficient funds',
    ],
    ['enable', 'the estimated return is low', { isEstimatedReturnLow: true }],
    ['enable', 'there are no validation errors', {}, 'Swap'],
  ])(
    'should %s the component when quotes are loading and %s',
    async (
      status: 'disable' | 'enable',
      _: string,
      validationErrors: Record<string, boolean>,
      buttonLabel: string = 'Swap',
    ) => {
      const mockStore = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            chainRanking: [
              { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
              { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
              { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
            ],
          },
        },
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: 'ETH',
          toToken: 'ETH',
          toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.LOADING,
        },
      });
      jest.spyOn(bridgeSelectors, 'getValidationErrors').mockReturnValue({
        isTxAlertPresent: false,
        isNoQuotesAvailable: false,
        isInsufficientGasBalance: false,
        isInsufficientGasForQuote: false,
        isInsufficientBalance: false,
        isEstimatedReturnLow: false,
        ...validationErrors,
      });
      const { findByRole } = renderWithProvider(
        <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
        configureStore(mockStore),
      );

      expect(await findByRole('button')).toHaveTextContent(buttonLabel);
      if (status === 'disable') {
        expect(await findByRole('button')).toBeDisabled();
      } else {
        expect(await findByRole('button')).not.toBeDisabled();
      }
    },
  );

  it('should not disable the component when quotes are loading and there are existing quotes', () => {
    const mockStore = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET) },
          ],
        },
      },
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        fromToken: 'ETH',
        toToken: 'ETH',
        toChainId: formatChainIdToCaip(CHAIN_IDS.LINEA_MAINNET),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <BridgeCTAButton onFetchNewQuotes={jest.fn()} />,
      configureStore(mockStore),
    );

    expect(getByText('Swap')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
    expect(getByRole('button')).toMatchInlineSnapshot(`
      <button
        class="mm-box mm-text mm-button-base mm-button-base--size-lg mm-button-primary mm-text--body-md-medium mm-box--padding-0 mm-box--padding-right-4 mm-box--padding-left-4 mm-box--display-inline-flex mm-box--justify-content-center mm-box--align-items-center mm-box--width-full mm-box--color-icon-inverse mm-box--background-color-icon-default mm-box--rounded-xl"
        data-testid="bridge-cta-button"
        style="box-shadow: none;"
      >
        Swap
      </button>
    `);
  });
});
