import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import SecurityTrustPage from './security-trust-page';

const mockNavigate = jest.fn();
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

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

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
    topHolders: [{ holdingPercentage: 35 }],
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
  chainId: '0x1',
};

const createStore = () =>
  configureStore({
    reducer: (
      state = {
        metamask: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
              defaultBlockExplorerUrlIndex: 0,
              blockExplorerUrls: ['https://etherscan.io'],
              rpcEndpoints: [],
              defaultRpcEndpointIndex: 0,
            },
          },
          multichainNetworkConfigurationsByChainId: {},
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
    expect(mockNavigate).toHaveBeenCalledWith(-1);
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
