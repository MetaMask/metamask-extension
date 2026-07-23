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
} from './asset-page-security-trust';

jest.mock('../../../../selectors/security-trust/constants', () => ({
  IS_TOKEN_SECURITY_TRUST_UI_ENABLED: true,
}));

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
  features: [{ name: 'HIGH_REPUTATION_TOKEN' }],
  fees: null,
  financialStats: null,
  metadata: null,
  created: '2020-01-01T00:00:00.000Z',
};

const createStore = (useExternalServices: boolean) =>
  configureStore({
    reducer: (state = { metamask: { useExternalServices } }) => state,
  });

const renderSlots = ({
  securityData = mockSecurityData,
  useExternalServices = true,
}: {
  securityData?: TokenSecurityData | null;
  useExternalServices?: boolean;
} = {}) => {
  useTokenSecurityData.mockReturnValue({
    securityData,
    isLoading: false,
    error: null,
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
});
