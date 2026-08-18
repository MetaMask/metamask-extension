import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { SecurityTrustAnalyticsProperty } from '../components/security-trust/security-trust-analytics-properties';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import { EXTENSION_TRUST_AND_SECURITY_TDP_FLAG } from '../../../../shared/lib/assets/security-trust-feature-flags';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import SecurityTrustPage from './security-trust-page';

const mockNavigate = jest.fn();
const mockTrackEvent = jest.fn();
let mockLocationState: Record<string, unknown> | null = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    key: 'default',
    pathname: '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xabc/security-trust',
    search: '',
    hash: '',
    state: mockLocationState,
  }),
  useParams: () => ({
    chainId: 'eip155:1',
    asset: 'eip155:1/erc20:0xabc',
  }),
}));

jest.mock('../../../hooks/useTokenSecurityData', () => ({
  useTokenSecurityData: jest.fn(),
}));

jest.mock('../../../selectors/assets', () => ({
  getFungibleAssetForRoute: jest.fn(() => null),
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const { useTokenSecurityData } = jest.requireMock(
  '../../../hooks/useTokenSecurityData',
);

const assetId = 'eip155:1/erc20:0xabc' as CaipAssetType;

const baseSecurityData: TokenSecurityData = {
  resultType: 'Verified',
  maliciousScore: '0',
  features: [
    {
      featureId: 'VERIFIED_CONTRACT',
      type: 'Info',
      description: 'Published contract',
    },
  ],
  fees: {
    transfer: 0,
    transferFeeMaxAmount: null,
    buy: 0,
    sell: 0,
  },
  financialStats: {
    supply: 1000000000,
    topHolders: [
      {
        label: 'Top holder',
        name: 'Example',
        address: '0x1234567890123456789012345678901234567890',
        holdingPercentage: 35,
      },
    ],
    holdersCount: 1000,
    tradeVolume24h: null,
    lockedLiquidityPct: null,
    markets: [],
  },
  metadata: {
    externalLinks: {
      homepage: 'https://example.com',
      twitterPage: 'exampletoken',
      telegramChannelId: 'exampletoken',
    },
  },
  created: '2020-01-15T00:00:00.000Z',
};

const locationState = {
  securityData: baseSecurityData,
  symbol: 'USDC',
  decimals: 6,
  isNative: false,
  address: '0xabc',
  chainId: 'eip155:1',
};

const enabledSecurityTrustFlag = {
  enabled: true,
  minimumVersion: '0.0.0',
};

const createStore = ({
  securityTrustTdpFlag = enabledSecurityTrustFlag,
  useExternalServices = true,
}: {
  securityTrustTdpFlag?: boolean | { enabled: boolean; minimumVersion: string };
  useExternalServices?: boolean;
} = {}) =>
  configureStore({
    reducer: (
      state = {
        metamask: {
          useExternalServices,
          internalAccounts: {
            selectedAccount: MOCK_ACCOUNT_EOA.id,
            accounts: {
              [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
            },
          },
          remoteFeatureFlags: {
            [EXTENSION_TRUST_AND_SECURITY_TDP_FLAG]: securityTrustTdpFlag,
            solanaAccounts: { enabled: false, minimumVersion: '13.6.0' },
            solanaTestnetsEnabled: false,
            bitcoinTestnetsEnabled: false,
            bitcoinAccounts: { enabled: false, minimumVersion: '13.6.0' },
            tronAccounts: { enabled: false, minimumVersion: '13.6.0' },
            tronTestnetsEnabled: false,
          },
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
              defaultBlockExplorerUrlIndex: 0,
              blockExplorerUrls: ['https://etherscan.io'],
              rpcEndpoints: [{ url: 'https://mainnet.infura.io' }],
              defaultRpcEndpointIndex: 0,
            },
          },
          multichainNetworkConfigurationsByChainId: {
            'eip155:1': {
              chainId: 'eip155:1',
              name: 'Ethereum Mainnet',
            },
          },
          isEvmSelected: true,
          selectedNetworkClientId: 'mainnet',
          networksMetadata: {},
          networksWithTransactionActivity: {},
        },
      },
    ) => state,
  });

const renderPage = ({
  securityData = baseSecurityData,
  isLoading = false,
  prefetchedOnly = false,
}: {
  securityData?: TokenSecurityData | null;
  isLoading?: boolean;
  prefetchedOnly?: boolean;
} = {}) => {
  mockLocationState = prefetchedOnly
    ? { ...locationState, securityData }
    : locationState;

  useTokenSecurityData.mockReturnValue({
    securityData: prefetchedOnly ? null : securityData,
    isLoading,
    error: null,
  });

  return renderWithProvider(<SecurityTrustPage />, createStore());
};

describe('SecurityTrustPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = locationState;
    globalThis.open = jest.fn();
    document.querySelector('.app')?.scroll(0, 0);
  });

  it('redirects to asset page when security trust TDP flag is disabled', () => {
    useTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
    });

    renderWithProvider(
      <SecurityTrustPage />,
      createStore({ securityTrustTdpFlag: false }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xabc',
      { replace: true },
    );
    expect(useTokenSecurityData).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: null,
        prefetchedData: undefined,
      }),
    );
    expect(
      screen.queryByTestId('security-trust-screen'),
    ).not.toBeInTheDocument();
  });

  it('renders loading state when data is loading and unavailable', () => {
    mockLocationState = {
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
      address: '0xabc',
    };

    useTokenSecurityData.mockReturnValue({
      securityData: null,
      isLoading: true,
      error: null,
    });

    renderWithProvider(<SecurityTrustPage />, createStore());

    expect(screen.getByTestId('security-trust-screen')).toBeInTheDocument();
    expect(screen.getByText(messages.loading.message)).toBeInTheDocument();
  });

  it('does not track page viewed while security data is loading', () => {
    mockLocationState = {
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
      address: '0xabc',
    };

    useTokenSecurityData.mockReturnValue({
      securityData: null,
      isLoading: true,
      error: null,
    });

    renderWithProvider(<SecurityTrustPage />, createStore());

    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityPageViewed,
      }),
    );
  });

  it('tracks page viewed after security data loads', () => {
    mockLocationState = {
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
      address: '0xabc',
      chainId: 'eip155:1',
    };

    useTokenSecurityData.mockReturnValue({
      securityData: null,
      isLoading: true,
      error: null,
    });

    const { rerender } = renderWithProvider(
      <SecurityTrustPage />,
      createStore(),
    );

    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityPageViewed,
      }),
    );

    useTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
    });

    rerender(<SecurityTrustPage />);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityPageViewed,
        properties: expect.objectContaining({
          severity: 'Verified',
          [SecurityTrustAnalyticsProperty.TokenSymbol]: 'USDC',
          [SecurityTrustAnalyticsProperty.ChainId]: 'eip155:1',
        }),
      }),
    );
  });

  it('tracks page viewed on mount', () => {
    renderPage();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityPageViewed,
      }),
    );
  });

  it('tracks cta click when official link is opened', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('security-trust-link-website'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityPageCtaClicked,
      }),
    );
  });

  it('tracks page dismissed when back button is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('security-trust-back-button'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SecurityPageDismissed,
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('renders verified summary and feature tags', () => {
    renderPage();

    expect(
      screen.getByText(messages.securityTrustVerified.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustSubtitleKnown.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustFeatureVerifiedContract.message),
    ).toBeInTheDocument();
  });

  it('renders buy and sell tax with no hidden fees banner', () => {
    renderPage();

    expect(
      screen.getByText(messages.securityTrustBuyTax.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustSellTax.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustTransfer.message),
    ).toBeInTheDocument();
    expect(screen.getAllByText('0.0%').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(messages.securityTrustNoHiddenFeesDetected.message),
    ).toBeInTheDocument();
  });

  it('omits no hidden fees banner when fees are non-zero', () => {
    renderPage({
      securityData: {
        ...baseSecurityData,
        fees: {
          transfer: 0,
          transferFeeMaxAmount: null,
          buy: 1.5,
          sell: 0,
        },
      },
    });

    expect(
      screen.queryByText(messages.securityTrustNoHiddenFeesDetected.message),
    ).not.toBeInTheDocument();
  });

  it('renders official links with icons', () => {
    renderPage();

    expect(
      screen.getByTestId('security-trust-link-website'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('security-trust-link-twitter'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('security-trust-link-telegram'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('security-trust-link-explorer'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustWebsite.message),
    ).toBeInTheDocument();
    expect(screen.getByText('@exampletoken')).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustTelegram.message),
    ).toBeInTheDocument();
  });

  it('opens official links in a new tab', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('security-trust-link-website'));
    expect(globalThis.open).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer',
    );

    fireEvent.click(screen.getByTestId('security-trust-link-twitter'));
    expect(globalThis.open).toHaveBeenCalledWith(
      'https://x.com/exampletoken',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('navigates back when back button is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('security-trust-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('renders prefetched security data without loading state', () => {
    useTokenSecurityData.mockReturnValue({
      securityData: null,
      isLoading: true,
      error: null,
    });

    mockLocationState = locationState;

    renderWithProvider(<SecurityTrustPage />, createStore());

    expect(
      screen.queryByText(messages.loading.message),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustVerified.message),
    ).toBeInTheDocument();
    expect(useTokenSecurityData).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId,
        prefetchedData: baseSecurityData,
      }),
    );
  });

  it('renders token distribution and info sections', () => {
    renderPage();

    expect(
      screen.getByText(messages.securityTrustTokenDistribution.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustTotalSupply.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustTop10Holders.message),
    ).toBeInTheDocument();
    expect(screen.getByText('35.0%')).toBeInTheDocument();
    expect(
      screen.getByText(messages.securityTrustTokenInfo.message),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.network.message)).toBeInTheDocument();
    expect(screen.getByText('ERC-20')).toBeInTheDocument();
  });
});
