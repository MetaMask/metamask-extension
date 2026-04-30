/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import type { Provider } from '@metamask/network-controller';
import {
  formatChainIdToCaip,
  QuoteResponse,
  QuoteStreamCompleteReason,
  RequestStatus,
} from '@metamask/bridge-controller';
import * as reactRouterUtils from 'react-router-dom';
import { BridgeAssetSecurityDataType } from '../../utils/tokens';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import { createBridgeMockStore } from '../../../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import mockBridgeQuotesErc20Erc20 from '../../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createTestProviderTools } from '../../../../../test/stub/provider';
import { setBackgroundConnection } from '../../../../store/background-connection';
import configureStore from '../../../../store/store';
import {
  ConnectionStatus,
  HardwareConnectionPermissionState,
  HardwareWalletProvider,
} from '../../../../contexts/hardware-wallets';
import * as bridgeSelectors from '../../../../ducks/bridge/selectors';
import PrepareBridgePage from '../prepare-bridge-page';

// Mock the bridge hooks
jest.mock('../../hooks/useGasIncluded7702', () => ({
  useGasIncluded7702: jest.fn().mockReturnValue(false),
}));

jest.mock('../../hooks/useIsSendBundleSupported', () => ({
  useIsSendBundleSupported: jest.fn().mockReturnValue(false),
}));

const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletState = jest.fn();

jest.mock('../../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../../contexts/hardware-wallets'),
  useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
  useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));

setBackgroundConnection({
  resetState: async () => jest.fn(),
  getStatePatches: async () => jest.fn(),
  updateBridgeQuoteRequestParams: async () => jest.fn(),
} as never);

describe('BridgeAlertBannerList', () => {
  beforeAll(() => {
    const { provider } = createTestProviderTools({
      networkId: 'Ethereum',
      chainId: CHAIN_IDS.MAINNET,
    });

    global.ethereumProvider = provider as unknown as Provider;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHardwareWalletConfig.mockReturnValue({
      isHardwareWalletAccount: false,
      walletType: null,
      hardwareConnectionPermissionState:
        HardwareConnectionPermissionState.Unknown,
      isWebHidAvailable: false,
      isWebUsbAvailable: false,
    });
    mockUseHardwareWalletActions.mockReturnValue({
      ensureDeviceReady: jest.fn().mockResolvedValue(true),
    });
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });
  });

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    [
      'no-quotes',
      'no quotes',
      {
        isNoQuotesAvailable: true,
      },
    ],
    [
      'no-quotes',
      'reason is available',
      {
        isNoQuotesAvailable: true,
      },
      {},
      {
        quoteStreamComplete: {
          hasQuotes: false,
          quoteCount: 0,
          reason: QuoteStreamCompleteReason.AMOUNT_TOO_HIGH,
        },
      },
    ],
    [
      'market-closed',
      'market is closed',
      {
        isStockMarketClosed: true,
      },
    ],
    [
      'market-closed',
      'market is closed (no quotes)',
      {
        isStockMarketClosed: true,
        isNoQuotesAvailable: true,
      },
    ],
    [
      'tx-alert',
      'tx alert is present',
      { isQuoteExpired: false },
      {
        txAlert: {
          titleId: 'txAlertTitle',
          description: 'Tx alert description',
          descriptionId: 'bridgeSelectDifferentQuote',
        },
      },
    ],
    [
      'insufficient-gas',
      'insufficient gas',
      { isInsufficientGasForQuote: true, insufficientBalance: false },
    ],
    [
      'token-security',
      'token warning',
      undefined,
      {
        toToken: {
          assetId: toAssetId(
            '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            formatChainIdToCaip(CHAIN_IDS.POLYGON),
          ),
          chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
          address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          symbol: 'USDC',
          name: 'Native USD Coin (POS)',
          decimals: 6,
          securityData: {
            type: BridgeAssetSecurityDataType.MALICIOUS,
            metadata: {
              features: [
                {
                  featureId: 'HONEYPOT',
                  type: BridgeAssetSecurityDataType.MALICIOUS,
                  description: 'Token warning description 1',
                },
              ],
            },
          },
        },
      },
      undefined,
    ],
  ])(
    'should render the %s alert when %s',
    async (
      id: string,
      _: string,
      validationErrors?: Record<string, boolean>,
      bridgeSliceOverrides = {},
      bridgeStateOverrides = {},
    ) => {
      jest
        .spyOn(reactRouterUtils, 'useSearchParams')
        .mockReturnValue([{ get: () => '0x3103910' }, jest.fn()] as never);
      validationErrors &&
        jest
          .spyOn(bridgeSelectors, 'getValidationErrors')
          .mockReturnValue(validationErrors as never);
      const mockStore = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: {
            assetId: 'eip155:10/slip44:60',
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM),
            decimals: 18,
          },
          toToken: {
            assetId: toAssetId(
              '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
              formatChainIdToCaip(CHAIN_IDS.POLYGON),
            ),
            chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            symbol: 'USDC',
            name: 'Native USD Coin (POS)',
            decimals: 6,
          },
          ...bridgeSliceOverrides,
        },
        bridgeStateOverrides: {
          quotesInitialLoadTime: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesRefreshCount: 1,
          quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
          quoteRequest: {
            srcTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            destTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            srcChainId: 1,
            destChainId: 10,
            walletAddress: '0x123',
            slippage: 0.5,
            srcTokenAmount: '1',
          },
          ...bridgeStateOverrides,
        },
      });
      const { getByTestId, getAllByTestId } = renderWithProvider(
        <HardwareWalletProvider>
          <PrepareBridgePage onOpenSettings={jest.fn()} />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );

      expect(
        getAllByTestId(`bridge-${id}`).map((alert) => alert.textContent),
      ).toMatchSnapshot();
      expect(getByTestId('bridge-banner-alerts')).toMatchSnapshot();
    },
  );

  describe('price-data-unavailable banner', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    const renderWithNoPriceData = (validationErrorOverrides = {}) => {
      jest
        .spyOn(reactRouterUtils, 'useSearchParams')
        .mockReturnValue([{ get: () => '0x3103910' }, jest.fn()] as never);
      jest
        .spyOn(bridgeSelectors, 'getActiveQuotePriceData')
        .mockReturnValue(undefined as never);
      if (Object.keys(validationErrorOverrides).length > 0) {
        jest
          .spyOn(bridgeSelectors, 'getValidationErrors')
          .mockReturnValue(validationErrorOverrides as never);
      }

      const mockStore = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: {
            assetId: 'eip155:10/slip44:60',
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM),
            decimals: 18,
          },
          toToken: {
            assetId: toAssetId(
              '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
              formatChainIdToCaip(CHAIN_IDS.POLYGON),
            ),
            chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            symbol: 'USDC',
            name: 'Native USD Coin (POS)',
            decimals: 6,
          },
        },
        bridgeStateOverrides: {
          quotesInitialLoadTime: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesRefreshCount: 1,
          quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
          quoteRequest: {
            srcTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            destTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            srcChainId: 1,
            destChainId: 10,
            walletAddress: '0x123',
            slippage: 0.5,
            srcTokenAmount: '1',
          },
        },
      });

      return renderWithProvider(
        <HardwareWalletProvider>
          <PrepareBridgePage onOpenSettings={jest.fn()} />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );
    };

    it('renders the banner when activeQuotePriceData is absent', async () => {
      const { getByTestId } = renderWithNoPriceData();

      expect(
        getByTestId('bridge-price-data-unavailable').textContent,
      ).toMatchSnapshot();
      expect(getByTestId('bridge-banner-alerts')).toMatchSnapshot();
    });

    it('renders the banner even when the quote is expired', async () => {
      const { getByTestId } = renderWithNoPriceData({ isQuoteExpired: true });

      expect(
        getByTestId('bridge-price-data-unavailable').textContent,
      ).toMatchSnapshot();
    });
  });

  // @ts-expect-error: each is a valid test function in jest
  it.each([
    [
      'price impact error',
      {
        isPriceImpactError: true,
      },
    ],
    [
      'price impact warning',
      {
        isPriceImpactWarning: true,
      },
    ],
  ])(
    'should render the %s alert',
    async (_: string, validationErrors: Record<string, boolean>) => {
      jest
        .spyOn(reactRouterUtils, 'useSearchParams')
        .mockReturnValue([{ get: () => '0x3103910' }, jest.fn()] as never);
      validationErrors &&
        jest
          .spyOn(bridgeSelectors, 'getValidationErrors')
          .mockReturnValue(validationErrors as never);
      // Provide price data so the price-data-unavailable banner does not appear
      // (mockBridgeQuotesErc20Erc20 has no priceData field)
      jest
        .spyOn(bridgeSelectors, 'getActiveQuotePriceData')
        .mockReturnValue({ priceImpact: 0 } as never);
      const mockStore = createBridgeMockStore({
        bridgeSliceOverrides: {
          fromTokenInputValue: '1',
          fromToken: {
            assetId: 'eip155:10/slip44:60',
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            name: 'Ethereum',
            chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM),
            decimals: 18,
          },
          toToken: {
            assetId: toAssetId(
              '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
              formatChainIdToCaip(CHAIN_IDS.POLYGON),
            ),
            chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
            address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            symbol: 'USDC',
            name: 'Native USD Coin (POS)',
            decimals: 6,
          },
        },
        bridgeStateOverrides: {
          quotesInitialLoadTime: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesRefreshCount: 1,
          quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
          quoteRequest: {
            srcTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            destTokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            srcChainId: 1,
            destChainId: 10,
            walletAddress: '0x123',
            slippage: 0.5,
            srcTokenAmount: '1',
          },
        },
      });
      const { getByTestId } = renderWithProvider(
        <HardwareWalletProvider>
          <PrepareBridgePage onOpenSettings={jest.fn()} />
        </HardwareWalletProvider>,
        configureStore(mockStore),
      );

      expect(getByTestId('bridge-banner-alerts')).toHaveTextContent('');
    },
  );
});
