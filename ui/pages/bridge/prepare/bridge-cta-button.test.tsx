import React from 'react';
import {
  QuoteResponse,
  RequestStatus,
  getNativeAssetForChainId,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { userEvent } from '@testing-library/user-event';
import { act } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockBridgeQuotesNativeErc20 from '../../../../test/data/bridge/mock-quotes-native-erc20.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import * as bridgeSelectors from '../../../ducks/bridge/selectors';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import {
  ConnectionStatus,
  HardwareConnectionPermissionState,
  HardwareWalletProvider,
  HardwareWalletType,
} from '../../../contexts/hardware-wallets';
import { setBackgroundConnection } from '../../../store/background-connection';
import { BridgeCTAButton } from './bridge-cta-button';

const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletState = jest.fn();
const mockOnOpenPriceImpactWarningModal = jest.fn();

jest.mock('../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../contexts/hardware-wallets'),
  useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
  useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));

const baseHardwareWalletConfig = {
  isHardwareWalletAccount: false,
  walletType: null,
  hardwareConnectionPermissionState: HardwareConnectionPermissionState.Unknown,
  isWebHidAvailable: false,
  isWebUsbAvailable: false,
};

setBackgroundConnection({
  submitTx: jest.fn(),
  setEnabledAllPopularNetworks: jest.fn(),
  getStatePatches: jest.fn(),
} as never);

describe('BridgeCTAButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHardwareWalletConfig.mockReturnValue(baseHardwareWalletConfig);
    mockUseHardwareWalletActions.mockReturnValue({
      ensureDeviceReady: jest.fn().mockResolvedValue(true),
    });
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });
  });

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
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByText(messages.swapSelectToken.message)).toBeInTheDocument();
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
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
      },
    });
    const { getByText } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.bridgeEnterAmount.message)).toBeInTheDocument();
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
          chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET),
          assetId: getNativeAssetForChainId(1).assetId,
        },
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
      },
    });
    const { getByText, container } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.bridgeEnterAmount.message)).toBeInTheDocument();
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
          chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET),
          assetId: getNativeAssetForChainId(1).assetId,
        },
        toToken: null,
      },
    });
    const { getByText, container } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.bridgeEnterAmount.message)).toBeInTheDocument();
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
        fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.swap.message)).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });

  it('clears declined state when fetching new quotes', async () => {
    const onFetchNewQuotes = jest.fn();
    const mockStore = createBridgeMockStore({
      bridgeSliceOverrides: {
        wasTxDeclined: true,
      },
    });
    const store = configureStore(mockStore);
    const { getByText } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={onFetchNewQuotes}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      store,
    );

    await userEvent.click(getByText(messages.bridgeFetchNewQuotes.message));

    expect(onFetchNewQuotes).toHaveBeenCalledTimes(1);
    expect(store.getState().bridge.wasTxDeclined).toBe(false);
  });

  it('should render hardware wallet connect label with wallet name', () => {
    mockUseHardwareWalletConfig.mockReturnValue({
      ...baseHardwareWalletConfig,
      isHardwareWalletAccount: true,
      walletType: HardwareWalletType.Ledger,
    });

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
        fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });

    const { getByText, getByRole } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText('Connect Ledger')).toBeInTheDocument();
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
        fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
      },
      bridgeStateOverrides: {
        quotes: [],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { container } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
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
      messages.insufficientFundsSend.message,
    ],
    ['enable', 'the estimated return is low', { isEstimatedReturnLow: true }],
    ['enable', 'there are no validation errors', {}, messages.swap.message],
  ])(
    'should %s the component when quotes are loading and %s',
    async (
      status: 'disable' | 'enable',
      _: string,
      validationErrors: Record<string, boolean>,
      buttonLabel: string = messages.swap.message,
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
          fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
          toToken: toBridgeToken(
            getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
          ),
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
        isTxAlertLoading: false,
        isPriceImpactWarning: false,
        isPriceImpactError: false,
        ...validationErrors,
      });
      const { findByRole } = renderWithProvider(
        <HardwareWalletProvider>
          <BridgeCTAButton
            onFetchNewQuotes={jest.fn()}
            onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
          />
        </HardwareWalletProvider>,
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
        fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.swap.message)).toBeInTheDocument();
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

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    { priceImpact: '0.253', expectedOpenModalCalls: 1 }, // error
    { priceImpact: '0', expectedOpenModalCalls: 0 }, // neither
    { priceImpact: '0.056', expectedOpenModalCalls: 0 }, // warning
  ])(
    'should open the price impact modal $expectedOpenModalCalls times when price impact is $priceImpact',
    async ({
      priceImpact,
      expectedOpenModalCalls,
    }: {
      priceImpact: string;
      expectedOpenModalCalls: number;
    }) => {
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
          fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
          toToken: toBridgeToken(
            getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
          ),
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20.map((quote) => ({
            ...quote,
            quote: {
              ...quote.quote,
              priceData: { ...quote.quote.priceData, priceImpact },
            },
          })) as unknown as QuoteResponse[],
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.LOADING,
        },
      });
      const { getByText, getByRole } = renderWithProvider(
        <HardwareWalletProvider>
          <BridgeCTAButton
            onFetchNewQuotes={jest.fn()}
            onOpenPriceImpactWarningModal={mockOnOpenPriceImpactWarningModal}
          />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );

      expect(getByText(messages.swap.message)).toBeInTheDocument();
      expect(getByRole('button')).not.toBeDisabled();
      await act(async () => {
        await userEvent.click(getByRole('button'));
      });
      expect(mockOnOpenPriceImpactWarningModal).toHaveBeenCalledTimes(
        expectedOpenModalCalls,
      );
    },
  );
});
