import React from 'react';
import { fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  AssetPageSecurityTrustBanner,
  AssetPageSecurityTrustHeaderBadge,
  AssetPageSecurityTrustProvider,
  AssetPageSecurityTrustSection,
  useAssetPageSecurityTrustCtaGate,
  useAssetPageSecurityTrustCtaGateReady,
} from './asset-page-security-trust';

jest.mock('../../../../hooks/useTokenSecurityData', () => ({
  useTokenSecurityData: jest.fn(),
}));

const { useTokenSecurityData } = jest.requireMock(
  '../../../../hooks/useTokenSecurityData',
);

const assetId = 'eip155:1/erc20:0xabc' as CaipAssetType;

const token = {
  symbol: 'AAVE',
  name: 'Aave',
  chainId: 'eip155:1',
  address: '0xabc',
  decimals: 18,
  isNative: false,
};

const mockSecurityData: TokenSecurityData = {
  resultType: 'Verified',
  maliciousScore: '0',
  features: [
    {
      featureId: 'VERIFIED_CONTRACT',
      type: 'Info',
      description: 'Verified contract',
    },
  ],
  fees: {
    transfer: 0,
    transferFeeMaxAmount: null,
    buy: 0,
    sell: null,
  },
  financialStats: {
    supply: 1000000,
    topHolders: [],
    holdersCount: 100,
    tradeVolume24h: null,
    lockedLiquidityPct: null,
    markets: [],
  },
  metadata: {
    externalLinks: {
      homepage: null,
      twitterPage: null,
      telegramChannelId: null,
    },
  },
  created: '2020-01-01T00:00:00.000Z',
};

const createStore = (useExternalServices: boolean) =>
  configureStore({
    reducer: (state = { metamask: { useExternalServices } }) => state,
  });

const renderSlots = ({
  securityData = mockSecurityData,
  useExternalServices = true,
  isLoading = false,
  error = null,
}: {
  securityData?: TokenSecurityData | null;
  useExternalServices?: boolean;
  isLoading?: boolean;
  error?: Error | null;
} = {}) => {
  useTokenSecurityData.mockReturnValue({
    securityData,
    isLoading,
    error,
  });

  return renderWithProvider(
    <AssetPageSecurityTrustProvider assetId={assetId} token={token}>
      <AssetPageSecurityTrustHeaderBadge />
      <AssetPageSecurityTrustBanner />
      <AssetPageSecurityTrustSection />
    </AssetPageSecurityTrustProvider>,
    createStore(useExternalServices),
  );
};

const CtaGateProbe = ({
  onGate,
}: {
  onGate: (gate: {
    gateCtaAction: ReturnType<typeof useAssetPageSecurityTrustCtaGate>;
    isCtaGateReady: boolean;
  }) => void;
}) => {
  const gateCtaAction = useAssetPageSecurityTrustCtaGate();
  const isCtaGateReady = useAssetPageSecurityTrustCtaGateReady();

  React.useEffect(() => {
    onGate({ gateCtaAction, isCtaGateReady });
  }, [gateCtaAction, isCtaGateReady, onGate]);

  return null;
};

describe('AssetPageSecurityTrust', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders verified header badge for verified tokens', () => {
    const { getAllByTestId } = renderSlots();
    expect(getAllByTestId('security-badge-verified').length).toBeGreaterThan(0);
  });

  it('renders malicious banner when result type is malicious', () => {
    const { getByTestId } = renderSlots({
      securityData: { ...mockSecurityData, resultType: 'Malicious' },
    });

    expect(getByTestId('security-banner-malicious')).toBeInTheDocument();
  });

  it('renders entry card section', () => {
    const { getByTestId } = renderSlots();
    expect(getByTestId('security-trust-section')).toBeInTheDocument();
    expect(getByTestId('security-trust-entry-card')).toBeInTheDocument();
  });

  it('opens info modal when verified badge is clicked', () => {
    const { getAllByTestId, getByTestId } = renderSlots();

    fireEvent.click(getAllByTestId('security-badge-verified')[0]);
    expect(getByTestId('security-trust-info-modal')).toBeInTheDocument();
    expect(getByTestId('security-trust-info-modal-got-it')).toBeInTheDocument();
  });

  it('opens info modal when malicious banner is clicked', () => {
    const { getByTestId } = renderSlots({
      securityData: {
        ...mockSecurityData,
        resultType: 'Malicious',
        features: [
          {
            featureId: 'KNOWN_MALICIOUS',
            type: 'Malicious',
            description: 'Known malicious',
          },
        ],
      },
    });

    fireEvent.click(getByTestId('security-banner-malicious'));
    expect(getByTestId('security-trust-info-modal')).toBeInTheDocument();
  });

  it('renders nothing when feature is disabled', () => {
    const { queryByTestId } = renderSlots({ useExternalServices: false });

    expect(queryByTestId('security-badge-verified')).not.toBeInTheDocument();
    expect(queryByTestId('security-trust-section')).not.toBeInTheDocument();
  });

  it('hides badge and banner while security data is loading', () => {
    const { queryByTestId } = renderSlots({
      securityData: null,
      isLoading: true,
    });

    expect(queryByTestId('security-badge-verified')).not.toBeInTheDocument();
    expect(queryByTestId('security-banner-malicious')).not.toBeInTheDocument();
    expect(queryByTestId('security-banner-warning')).not.toBeInTheDocument();
  });

  it('hides badge and banner when security data fetch fails', () => {
    const { queryByTestId } = renderSlots({
      securityData: null,
      isLoading: false,
      error: new Error('Fetch failed'),
    });

    expect(queryByTestId('security-badge-verified')).not.toBeInTheDocument();
    expect(queryByTestId('security-banner-malicious')).not.toBeInTheDocument();
  });

  it('blocks CTA gating while security data is loading', () => {
    const onGate = jest.fn();
    useTokenSecurityData.mockReturnValue({
      securityData: { ...mockSecurityData, resultType: 'Malicious' },
      isLoading: true,
      error: null,
    });

    renderWithProvider(
      <AssetPageSecurityTrustProvider assetId={assetId} token={token}>
        <CtaGateProbe onGate={onGate} />
      </AssetPageSecurityTrustProvider>,
      createStore(true),
    );

    const gate = onGate.mock.calls.at(-1)?.[0];
    const action = jest.fn();
    gate?.gateCtaAction(action, 'buy');

    expect(gate?.isCtaGateReady).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it('blocks CTA gating when security data fetch fails', () => {
    const onGate = jest.fn();
    useTokenSecurityData.mockReturnValue({
      securityData: { ...mockSecurityData, resultType: 'Malicious' },
      isLoading: false,
      error: new Error('Fetch failed'),
    });

    renderWithProvider(
      <AssetPageSecurityTrustProvider assetId={assetId} token={token}>
        <CtaGateProbe onGate={onGate} />
      </AssetPageSecurityTrustProvider>,
      createStore(true),
    );

    const gate = onGate.mock.calls.at(-1)?.[0];
    const action = jest.fn();
    gate?.gateCtaAction(action, 'swap');

    expect(gate?.isCtaGateReady).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });
});
