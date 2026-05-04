import React from 'react';
import {
  QuoteResponse,
  RequestStatus,
  getNativeAssetForChainId,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { userEvent } from '@testing-library/user-event';
import { act, render } from '@testing-library/react';
import {
  createProviderWrapper,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
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
import { MetaMetricsHardwareWalletRecoveryLocation } from '../../../../shared/constants/metametrics';
import { trackHardwareWalletRecoveryConnectCtaClicked } from '../../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked';
import * as useSubmitBridgeTransactionModule from '../hooks/useSubmitBridgeTransaction';
import { BridgeCTAButton } from './bridge-cta-button';

const mockTrackHardwareWalletRecoveryConnectCtaClicked = jest.mocked(
  trackHardwareWalletRecoveryConnectCtaClicked,
);

const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletState = jest.fn();
const mockOnOpenPriceImpactWarningModal = jest.fn();
const mockResetState = jest.fn();

jest.mock('../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../contexts/hardware-wallets'),
  useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
  useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));
jest.mock(
  '../../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked',
);

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
  resetState: () => mockResetState(),
} as never);

describe('BridgeCTAButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackHardwareWalletRecoveryConnectCtaClicked.mockReset();
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(container).toMatchSnapshot();

    expect(getByText(messages.swapSelectToken.message)).toBeInTheDocument();
    expect(mockResetState).not.toHaveBeenCalled();
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
        />
      </HardwareWalletProvider>,
      store,
    );

    await userEvent.click(getByText(messages.bridgeGetNewQuote.message));

    expect(onFetchNewQuotes).toHaveBeenCalledTimes(1);
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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText('Connect Ledger')).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
  });

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    {
      description: 'no alert modal is provided',
      isAlertModalProvided: false,
      expectedAlertModalCalls: 0,
      expectedSubmitBridgeTransactionCalls: 1,
    },
    {
      description: 'alert modal is provided',
      isAlertModalProvided: true,
      expectedAlertModalCalls: 1,
      expectedSubmitBridgeTransactionCalls: 0,
    },
  ])(
    'calls recovery CTA analytics when hardware wallet user submits while device is disconnected and $description',
    async ({
      isAlertModalProvided,
      expectedAlertModalCalls,
      expectedSubmitBridgeTransactionCalls,
    }: {
      isAlertModalProvided: boolean;
      expectedAlertModalCalls: number;
      expectedSubmitBridgeTransactionCalls: number;
    }) => {
      const mockSubmitBridgeTransaction = jest
        .fn()
        .mockResolvedValue(undefined);
      const useSubmitSpy = jest
        .spyOn(useSubmitBridgeTransactionModule, 'default')
        .mockImplementation(() => ({
          submitBridgeTransaction: mockSubmitBridgeTransaction,
          isSubmitting: false,
        }));

      const mockTrackEvent = jest.fn().mockResolvedValue(undefined);
      const connectionState = {
        status: ConnectionStatus.Disconnected as const,
      };
      mockUseHardwareWalletConfig.mockReturnValue({
        ...baseHardwareWalletConfig,
        isHardwareWalletAccount: true,
        walletType: HardwareWalletType.Ledger,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState,
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
      const store = configureStore(mockStore);
      const Wrapper = createProviderWrapper(store, '/', () => mockTrackEvent);

      const { getByRole } = render(
        <HardwareWalletProvider>
          <BridgeCTAButton
            onFetchNewQuotes={jest.fn()}
            onOpenAlertModals={
              isAlertModalProvided
                ? mockOnOpenPriceImpactWarningModal
                : undefined
            }
            onOpenRecipientModal={jest.fn()}
            onOpenMarketClosedModal={jest.fn()}
          />
        </HardwareWalletProvider>,
        { wrapper: Wrapper },
      );

      await act(async () => {
        await userEvent.click(getByRole('button'));
      });

      expect(
        mockTrackHardwareWalletRecoveryConnectCtaClicked,
      ).toHaveBeenCalledWith(mockTrackEvent, {
        location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
        walletType: HardwareWalletType.Ledger,
        connectionState,
      });
      expect(mockOnOpenPriceImpactWarningModal).toHaveBeenCalledTimes(
        expectedAlertModalCalls,
      );
      expect(mockSubmitBridgeTransaction).toHaveBeenCalledTimes(
        expectedSubmitBridgeTransactionCalls,
      );

      useSubmitSpy.mockRestore();
    },
  );

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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
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
    [
      'enable',
      'market is closed',
      { isStockMarketClosed: true },
      'Market closed',
    ],
    [
      'enable',
      'market is closed (no quotes after fetch)',
      { isStockMarketClosed: true },
      'Market closed',
      { quotesLoadingStatus: RequestStatus.FETCHED },
    ],
    [
      'enable',
      'recipient address is not set',
      { isStockMarketClosed: true },
      'Select a destination account',
      {},
      { fromTokenInputValue: null },
      { needsDestinationAddress: true },
    ],
  ])(
    'should %s the component when quotes are loading and %s',
    async (
      status: 'disable' | 'enable',
      _: string,
      validationErrors: Record<string, boolean>,
      buttonLabel: string = messages.swap.message,
      bridgeStateOverrides: Record<string, unknown> = {},
      bridgeSliceOverrides: Record<string, unknown> = {},
      propOverrides: Record<string, unknown> = {},
    ) => {
      const mockStore = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
          toToken: toBridgeToken(
            getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
          ),
          ...bridgeSliceOverrides,
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.LOADING,
          ...bridgeStateOverrides,
        },
      });
      jest.spyOn(bridgeSelectors, 'getValidationErrors').mockReturnValue({
        isTxAlertPresent: false,
        isNoQuotesAvailable: false,
        isInsufficientGasBalance: false,
        isInsufficientGasForQuote: false,
        isInsufficientBalance: false,
        isInsufficientNativeReserve: false,
        isEstimatedReturnLow: false,
        isTxAlertLoading: false,
        isStockMarketClosed: false,
        isPriceImpactWarning: false,
        isPriceImpactError: false,
        isQuoteExpired: false,
        ...validationErrors,
      });
      const { findByRole, getByText } = renderWithProvider(
        <HardwareWalletProvider>
          <BridgeCTAButton
            onFetchNewQuotes={jest.fn()}
            onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
            onOpenRecipientModal={jest.fn()}
            onOpenMarketClosedModal={jest.fn()}
            {...propOverrides}
          />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );

      expect(getByText(buttonLabel)).toBeInTheDocument();
      expect(await findByRole('button')).toHaveTextContent(buttonLabel);
      if (status === 'disable') {
        expect(await findByRole('button')).toBeDisabled();
      } else {
        expect(await findByRole('button')).not.toBeDisabled();
      }
    },
  );

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    ['market is closed (no quotes)', 'Market closed'],
    [
      'recipient address is not set (no quotes)',
      { fromTokenInputValue: null },
      { needsDestinationAddress: true },
    ],
  ])(
    'should render the component when quotes are loading and %s',
    async (
      _: string,
      bridgeSliceOverrides: Record<string, unknown> = {},
      propOverrides: Record<string, unknown> = {},
    ) => {
      const mockStore = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
          toToken: toBridgeToken(
            getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
          ),
          ...bridgeSliceOverrides,
        },
        bridgeStateOverrides: {
          quotes: [],
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
        isInsufficientNativeReserve: false,
        isEstimatedReturnLow: false,
        isTxAlertLoading: false,
        isPriceImpactWarning: false,
        isPriceImpactError: false,
        isStockMarketClosed: true,
        isQuoteExpired: false,
      });
      const { container } = renderWithProvider(
        <HardwareWalletProvider>
          <BridgeCTAButton
            onFetchNewQuotes={jest.fn()}
            onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
            onOpenRecipientModal={jest.fn()}
            onOpenMarketClosedModal={jest.fn()}
            {...propOverrides}
          />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );

      expect(container).toMatchSnapshot();
    },
  );

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    [
      'quote is expired (no quotes)',
      'Get new quote',
      {
        quotes: [],
        quotesLastFetched: Date.now() - 35000,
        quotesRefreshCount: 5,
      },
    ],
    [
      'there are no quotes and quote fetch has an error',
      'Select token',
      {
        quotes: [],
        quotesLastFetched: Date.now() - 5000,
        quotesLoadingStatus: RequestStatus.ERROR,
        quotesRefreshCount: 4,
      },
    ],
    ['tx is declined', 'Get new quote', {}, true],
    [
      'quote is expired',
      'Get new quote',
      {
        quotesLastFetched: Date.now() - 35000,
        quotesLoadingStatus: RequestStatus.FETCHED,
        quotesRefreshCount: 5,
      },
    ],
  ])(
    'should show CTA when %s',
    async (
      _: string,
      buttonLabel: string,
      bridgeStateOverrides: Record<string, boolean>,
      wasTxDeclined: boolean = false,
    ) => {
      const mockStore = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
          toToken: toBridgeToken(
            getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
          ),
          wasTxDeclined,
        },
        bridgeStateOverrides: {
          quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteRequest: {
            insufficientBal: false,
          },
          ...bridgeStateOverrides,
        },
      });
      const { findByText } = renderWithProvider(
        <HardwareWalletProvider>
          <BridgeCTAButton
            onFetchNewQuotes={jest.fn()}
            onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
            onOpenRecipientModal={jest.fn()}
            onOpenMarketClosedModal={jest.fn()}
          />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );

      expect(await findByText(buttonLabel)).toBeInTheDocument();
    },
  );

  it('should show fetch-quotes CTA when quote is expired and market is closed', async () => {
    const mockStore = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromTokenInputValue: '1',
        fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
        toToken: toBridgeToken(
          getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET),
        ),
        wasTxDeclined: false,
      },
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesNativeErc20 as unknown as QuoteResponse[],
        quotesLastFetched: Date.now() - 35000,
        quotesLoadingStatus: RequestStatus.FETCHED,
        quoteRequest: {
          insufficientBal: false,
        },
        quotesRefreshCount: 5,
      },
    });
    jest.spyOn(bridgeSelectors, 'getValidationErrors').mockReturnValue({
      isTxAlertPresent: false,
      isNoQuotesAvailable: false,
      isInsufficientGasBalance: false,
      isInsufficientGasForQuote: false,
      isInsufficientBalance: false,
      isInsufficientNativeReserve: false,
      isEstimatedReturnLow: false,
      isTxAlertLoading: false,
      isPriceImpactWarning: false,
      isPriceImpactError: false,
      isStockMarketClosed: true,
      isQuoteExpired: true,
    });
    const { getByText } = renderWithProvider(
      <HardwareWalletProvider>
        <BridgeCTAButton
          onFetchNewQuotes={jest.fn()}
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.bridgeGetNewQuote.message)).toBeInTheDocument();
  });

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
          onOpenAlertModals={mockOnOpenPriceImpactWarningModal}
          onOpenRecipientModal={jest.fn()}
          onOpenMarketClosedModal={jest.fn()}
        />
      </HardwareWalletProvider>,
      configureStore(mockStore),
    );

    expect(getByText(messages.swap.message)).toBeInTheDocument();
    expect(getByRole('button')).not.toBeDisabled();
    expect(getByRole('button')).toMatchInlineSnapshot(`
      <button
        class="inline-flex items-center justify-center rounded-xl px-4 font-medium min-w-20 overflow-hidden relative h-12 w-full transition-all duration-100 ease-linear active:scale-[0.97] active:ease-[cubic-bezier(0.3,0.8,0.3,1)] bg-icon-default text-primary-inverse hover:bg-icon-default-hover active:bg-icon-default-pressed focus-visible:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-default"
        data-testid="bridge-cta-button"
        role="button"
        style="box-shadow: none;"
      >
        <span
          class="text-inherit text-s-body-md leading-s-body-md tracking-s-body-md md:text-l-body-md md:leading-l-body-md md:tracking-l-body-md font-medium font-default"
        >
          Swap
        </span>
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
            onOpenAlertModals={
              expectedOpenModalCalls
                ? mockOnOpenPriceImpactWarningModal
                : undefined
            }
            onOpenRecipientModal={jest.fn()}
            onOpenMarketClosedModal={jest.fn()}
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
