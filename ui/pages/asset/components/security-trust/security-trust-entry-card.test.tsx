import React from 'react';
import { fireEvent } from '@testing-library/react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { SecurityTrustEntryCard } from './security-trust-entry-card';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSecurityData = {
  resultType: 'Benign',
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
  created: '2023-01-01T00:00:00Z',
} as TokenSecurityData;

const token = {
  symbol: 'RAIN',
  name: 'Rain',
  chainId: '0x1',
  address: '0xabc',
  decimals: 18,
  isNative: false,
  image: '',
  assetId: 'eip155:1/erc20:0xabc' as CaipAssetType,
};

describe('SecurityTrustEntryCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders loading skeleton', () => {
    const { getByTestId } = renderWithProvider(
      <SecurityTrustEntryCard securityData={null} isLoading token={token} />,
    );

    expect(getByTestId('security-trust-entry-card')).toBeInTheDocument();
  });

  it('navigates to security page when clicked', () => {
    const { getByTestId } = renderWithProvider(
      <SecurityTrustEntryCard
        securityData={mockSecurityData}
        isLoading={false}
        token={token}
      />,
    );

    fireEvent.click(getByTestId('security-trust-entry-card'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xabc/security-trust',
      expect.objectContaining({
        state: expect.objectContaining({
          securityData: mockSecurityData,
          symbol: 'RAIN',
        }),
      }),
    );
  });
});
