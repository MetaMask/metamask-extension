import React from 'react';
import { screen, act, waitFor, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Hex } from '@metamask/utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { trace } from '../../../../../shared/lib/trace';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import useMultiPolling from '../../../../hooks/useMultiPolling';
import { getTokenSymbol } from '../../../../store/actions';
import { getSelectedInternalAccountFromMockState } from '../../../../../test/jest/mocks';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { selectAccountGroupBalanceForEmptyState } from '../../../../selectors/assets';
import { BuyGetMusdCtaVariant } from '../../../../hooks/musd';
import AssetList from '.';

// Specific to just the ETH FIAT conversion
const CONVERSION_RATE = 1597.32;
const ETH_BALANCE = '0x041173b2c0e57d'; // 0.0011 ETH ($1.83)

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const LINK_CONTRACT = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
const WBTC_CONTRACT = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const mockOnClickAsset = jest.fn();
const mockShouldShowBuyGetMusdCta = jest.fn();
const mockHasConvertibleTokensByChainId = jest.fn();

jest.mock('../../../../hooks/useAnalytics', () => {
  const mockTrackEvent = jest.fn();

  return {
    useAnalytics: () => ({
      createEventBuilder: jest.requireActual(
        '../../../../../shared/lib/analytics/create-event-builder',
      ).createEventBuilder,
      trackEvent: mockTrackEvent,
    }),
    mockTrackEvent,
  };
});

const getMockTrackEvent = () =>
  jest.requireMock('../../../../hooks/useAnalytics')
    .mockTrackEvent as jest.Mock;

const mockUseMusdBalance = jest.fn();
const mockUseMusdNetworkFilter = jest.fn();
const mockUseMusdConversionTokens = jest.fn();

jest.mock('../token-list', () => {
  const { CHAIN_IDS: chainIds } = jest.requireActual(
    '../../../../../shared/constants/network',
  );
  const usdcContract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({
      onTokenClick,
    }: {
      onTokenClick: (
        chainId: string,
        address: string,
        assetId?: string,
      ) => void;
    }) => (
      <button
        data-testid="mock-token-list-item"
        onClick={() =>
          onTokenClick(chainIds.MAINNET, usdcContract, usdcContract)
        }
        type="button"
      >
        USDC
      </button>
    ),
  };
});

jest.mock('../../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock('../../../../store/actions', () => {
  return {
    getTokenSymbol: jest.fn(),
    setTokenNetworkFilter: jest.fn(() => ({
      type: 'TOKEN_NETWORK_FILTER',
    })),
    tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
    tokenBalancesStopPollingByPollingToken: jest.fn(),
    addImportedTokens: jest.fn(),
  };
});

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => jest.fn(),
  };
});

jest.mock('../../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue('US'),
}));

jest.mock('../../../../../shared/lib/trace', () => ({
  trace: jest.fn(),
  endTrace: jest.fn(),
  TraceName: {
    AssetDetails: 'Asset Details',
    AccountOverviewAssetListTab: 'Account Overview Asset List Tab',
  },
}));

jest.mock('../hooks', () => ({
  usePrimaryCurrencyProperties: () => ({
    primaryCurrencyProperties: { suffix: 'ETH' },
  }),
}));

jest.mock('../../../../selectors/assets', () => ({
  ...jest.requireActual('../../../../selectors/assets'),
  selectAccountGroupBalanceForEmptyState: jest.fn(),
}));

jest.mock('../../../../hooks/musd', () => ({
  useMusdCtaVisibility: () => ({
    shouldShowBuyGetMusdCta: mockShouldShowBuyGetMusdCta,
  }),
  useMusdBalance: () => mockUseMusdBalance(),
  useMusdNetworkFilter: () => mockUseMusdNetworkFilter(),
  useMusdConversionTokens: () => mockUseMusdConversionTokens(),
  BuyGetMusdCtaVariant: {
    BUY: 'buy',
    GET: 'get',
  },
}));

jest.mock('../../musd', () => ({
  MusdBuyGetCta: ({
    variant,
    selectedChainId,
  }: {
    variant: string | null;
    selectedChainId: string | null;
  }) => (
    <div
      data-testid="musd-buy-get-cta"
      data-variant={variant ?? ''}
      data-chain-id={selectedChainId ?? ''}
    />
  ),
}));

const mockSelectedInternalAccount = getSelectedInternalAccountFromMockState(
  mockState as unknown as MetaMaskReduxState,
);

type RenderAssetListOptions = {
  balance?: string;
  chainId?: Hex;
  showTokensLinks?: boolean;
  onClickAsset?: typeof mockOnClickAsset;
};

const renderAssetList = ({
  balance = ETH_BALANCE,
  chainId = CHAIN_IDS.MAINNET,
  showTokensLinks = true,
  onClickAsset = mockOnClickAsset,
}: RenderAssetListOptions = {}) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId }),
      currencyRates: {
        ETH: {
          conversionRate: CONVERSION_RATE,
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          [mockSelectedInternalAccount.address]: { balance },
        },
      },
      marketData: {
        [CHAIN_IDS.MAINNET]: {
          [USDC_CONTRACT]: { price: 0.00062566 },
          [LINK_CONTRACT]: { price: 0.00423239 },
          [WBTC_CONTRACT]: { price: 16.66575 },
        },
        '0x0': {
          [USDC_CONTRACT]: { price: 0.00062566 },
          [LINK_CONTRACT]: { price: 0.00423239 },
          [WBTC_CONTRACT]: { price: 16.66575 },
        },
      },
    },
  };
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetList onClickAsset={onClickAsset} showTokensLinks={showTokensLinks} />,
    store,
    '/',
  );
};

describe('AssetList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClickAsset.mockClear();
    getMockTrackEvent().mockClear();
    mockShouldShowBuyGetMusdCta.mockClear();
    mockHasConvertibleTokensByChainId.mockReset();

    (useMultiPolling as jest.Mock).mockImplementation(({ input }) => {
      const startPolling = jest.fn().mockResolvedValue('mockPollingToken');
      const stopPollingByPollingToken = jest.fn();

      input.forEach((inputItem: string) => {
        const key = JSON.stringify(inputItem);
        startPolling.mockResolvedValueOnce(`mockToken-${key}`);
      });

      return { startPolling, stopPollingByPollingToken };
    });
    (useIsOriginalNativeTokenSymbol as jest.Mock).mockReturnValue(true);

    (getTokenSymbol as jest.Mock).mockImplementation(async (address) => {
      if (address === USDC_CONTRACT) {
        return 'USDC';
      }
      if (address === LINK_CONTRACT) {
        return 'LINK';
      }
      if (address === WBTC_CONTRACT) {
        return 'WBTC';
      }
      return null;
    });

    jest.mocked(selectAccountGroupBalanceForEmptyState).mockReturnValue(true);
    mockUseMusdBalance.mockReturnValue({ hasMusdBalance: false });
    mockUseMusdNetworkFilter.mockReturnValue({ selectedChainId: null });
    mockUseMusdConversionTokens.mockReturnValue({
      tokens: [],
      hasConvertibleTokensByChainId: mockHasConvertibleTokensByChainId,
    });
    mockShouldShowBuyGetMusdCta.mockReturnValue({
      shouldShowCta: false,
      selectedChainId: null,
      isEmptyWallet: false,
      variant: null,
    });
  });

  it('renders AssetList component and shows AssetList control bar', async () => {
    await act(async () => {
      renderAssetList();
    });

    await waitFor(() => {
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(
        screen.getByTestId('asset-list-control-bar-action-button'),
      ).toBeInTheDocument();
    });
  });

  describe('mUSD CTA', () => {
    it('renders MusdBuyGetCta when shouldShowBuyGetMusdCta returns visible state', async () => {
      mockShouldShowBuyGetMusdCta.mockReturnValue({
        shouldShowCta: true,
        selectedChainId: CHAIN_IDS.MAINNET,
        isEmptyWallet: false,
        variant: BuyGetMusdCtaVariant.BUY,
      });

      await act(async () => {
        renderAssetList();
      });

      await waitFor(() => {
        expect(screen.getByTestId('musd-buy-get-cta')).toBeInTheDocument();
        expect(screen.getByTestId('musd-buy-get-cta')).toHaveAttribute(
          'data-variant',
          BuyGetMusdCtaVariant.BUY,
        );
      });
    });

    it('does not render MusdBuyGetCta when shouldShowBuyGetMusdCta returns hidden state', async () => {
      await act(async () => {
        renderAssetList();
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('musd-buy-get-cta'),
        ).not.toBeInTheDocument();
      });
    });

    it('passes hasConvertibleTokens false when the wallet has no balance', async () => {
      jest
        .mocked(selectAccountGroupBalanceForEmptyState)
        .mockReturnValue(false);

      await act(async () => {
        renderAssetList({ balance: '0x0' });
      });

      await waitFor(() => {
        expect(mockShouldShowBuyGetMusdCta).toHaveBeenCalledWith({
          hasConvertibleTokens: false,
          hasMusdBalance: false,
          isEmptyWallet: true,
          selectedChainId: null,
        });
      });
    });

    it('checks convertible tokens on the selected chain when a network filter is active', async () => {
      mockUseMusdNetworkFilter.mockReturnValue({
        selectedChainId: CHAIN_IDS.MAINNET,
      });
      mockHasConvertibleTokensByChainId.mockReturnValue(true);

      await act(async () => {
        renderAssetList();
      });

      await waitFor(() => {
        expect(mockHasConvertibleTokensByChainId).toHaveBeenCalledWith(
          CHAIN_IDS.MAINNET,
        );
        expect(mockShouldShowBuyGetMusdCta).toHaveBeenCalledWith(
          expect.objectContaining({
            hasConvertibleTokens: true,
          }),
        );
      });
    });

    it('uses conversion token count when no chain filter is selected', async () => {
      mockUseMusdConversionTokens.mockReturnValue({
        tokens: [{ symbol: 'USDC' }],
        hasConvertibleTokensByChainId: mockHasConvertibleTokensByChainId,
      });

      await act(async () => {
        renderAssetList();
      });

      await waitFor(() => {
        expect(mockShouldShowBuyGetMusdCta).toHaveBeenCalledWith(
          expect.objectContaining({
            hasConvertibleTokens: true,
          }),
        );
      });
    });
  });

  describe('token interactions', () => {
    it('calls onClickAsset and tracks navigation when a token is clicked', async () => {
      await act(async () => {
        renderAssetList();
      });

      fireEvent.click(screen.getByTestId('mock-token-list-item'));

      await waitFor(() => {
        expect(mockOnClickAsset).toHaveBeenCalledWith(
          CHAIN_IDS.MAINNET,
          USDC_CONTRACT,
          USDC_CONTRACT,
        );
        expect(trace).toHaveBeenCalledWith({ name: 'Asset Details' });
        expect(getMockTrackEvent()).toHaveBeenCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.TokenScreenOpened,
            properties: {
              category: MetaMetricsEventCategory.Navigation,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol: 'ETH',
              location: 'Home',
            },
            sensitiveProperties: {},
          }),
        );
      });
    });
  });

  describe('showTokensLinks', () => {
    it('enables the asset options control when showTokensLinks is true', async () => {
      await act(async () => {
        renderAssetList({ showTokensLinks: true });
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('asset-list-control-bar-action-button'),
        ).not.toBeDisabled();
      });
    });

    it('disables the asset options control when showTokensLinks is false', async () => {
      await act(async () => {
        renderAssetList({ showTokensLinks: false });
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('asset-list-control-bar-action-button'),
        ).toBeDisabled();
      });
    });
  });
});
