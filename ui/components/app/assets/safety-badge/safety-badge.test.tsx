import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CaipAssetType } from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { getUseExternalServices } from '../../../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../../../selectors/multichain/feature-flags';
import { getTokenAssetQueryKey } from '../../../../hooks/token-asset/tokenAssetQuery';
import { SafetyBadge } from './safety-badge';

jest.mock('../../../../selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../../../selectors/multichain/feature-flags', () => ({
  getIsSecurityTrustTdpEnabled: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const mockGetUseExternalServices = jest.mocked(getUseExternalServices);
const mockGetIsSecurityTrustTdpEnabled = jest.mocked(
  getIsSecurityTrustTdpEnabled,
);

const usdcAssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;

const createTokenAsset = (resultType: string): TokenAsset =>
  ({
    assetId: usdcAssetId,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    securityData: {
      resultType,
      features: [],
    },
  }) as unknown as TokenAsset;

describe('SafetyBadge', () => {
  const renderBadge = (queryClient: QueryClient) =>
    render(
      <QueryClientProvider client={queryClient}>
        <SafetyBadge assetId={usdcAssetId} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUseExternalServices.mockReturnValue(true);
    mockGetIsSecurityTrustTdpEnabled.mockReturnValue(true);
  });

  it('renders nothing when the cache is empty', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { queryByTestId } = renderBadge(queryClient);

    expect(queryByTestId('safety-badge')).not.toBeInTheDocument();
  });

  it('renders the verified icon when cache says Verified', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { getByTestId, getByLabelText } = renderBadge(queryClient);

    expect(getByTestId('safety-badge')).toBeInTheDocument();
    expect(getByLabelText('securityTrustVerified')).toBeInTheDocument();
  });

  it('renders the risky label when cache says Warning', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Warning'),
    );

    const { getByTestId, getByText } = renderBadge(queryClient);

    expect(getByTestId('safety-badge')).toBeInTheDocument();
    expect(getByText('securityTrustRisky')).toBeInTheDocument();
  });

  it('renders the malicious label when cache says Malicious', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Malicious'),
    );

    const { getByTestId, getByText } = renderBadge(queryClient);

    expect(getByTestId('safety-badge')).toBeInTheDocument();
    expect(getByText('securityTrustMalicious')).toBeInTheDocument();
  });

  it('renders nothing when security and trust is disabled', () => {
    mockGetIsSecurityTrustTdpEnabled.mockReturnValue(false);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { queryByTestId } = renderBadge(queryClient);

    expect(queryByTestId('safety-badge')).not.toBeInTheDocument();
  });

  it('renders nothing when basic functionality is off', () => {
    mockGetUseExternalServices.mockReturnValue(false);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getTokenAssetQueryKey(usdcAssetId),
      createTokenAsset('Verified'),
    );

    const { queryByTestId } = renderBadge(queryClient);

    expect(queryByTestId('safety-badge')).not.toBeInTheDocument();
  });
});
