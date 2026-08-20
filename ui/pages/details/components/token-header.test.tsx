import React from 'react';
import { render } from '@testing-library/react';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import type { TokenAsset } from '../../../hooks/useTokensData';
import { useTokensData } from '../../../hooks/useTokensData';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { TokenHeader } from './token-header';

jest.mock('../../../hooks/useI18nContext', () => {
  const { enLocale } = jest.requireActual('../../../../test/lib/i18n-helpers');
  return {
    useI18nContext: () => (key: string) => enLocale[key]?.message ?? key,
  };
});

jest.mock('../../../hooks/useTokensData', () => ({
  useTokensData: jest.fn(() => ({})),
}));

jest.mock('../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: ({ tokens }: { tokens: (string | undefined)[] }) => (
    <div data-testid="activity-avatar">{JSON.stringify(tokens)}</div>
  ),
}));

const mockUseTokensData = jest.mocked(useTokensData);

const STELLAR_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

const stellarToken: TokenAmount = {
  assetId: STELLAR_USDC_ASSET,
  symbol: 'USDC',
  direction: 'out',
};

describe('TokenHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTokensData.mockReturnValue({});
  });

  it('renders the token symbol when it is provided', () => {
    const { getByText } = render(<TokenHeader token={stellarToken} />);

    expect(getByText('USDC')).toBeInTheDocument();
  });

  it('passes the token asset id to the activity avatar', () => {
    const { getByTestId } = render(<TokenHeader token={stellarToken} />);

    expect(getByTestId('activity-avatar')).toHaveTextContent(
      JSON.stringify([STELLAR_USDC_ASSET]),
    );
  });

  it('falls back to the fetched metadata symbol when the token has no symbol', () => {
    mockUseTokensData.mockReturnValue({
      [STELLAR_USDC_ASSET.toLowerCase()]: {
        assetId: STELLAR_USDC_ASSET,
        iconUrl: '',
        name: 'USD Coin',
        symbol: 'USDC',
      },
    });

    const { getByText } = render(
      <TokenHeader token={{ assetId: STELLAR_USDC_ASSET, direction: 'out' }} />,
    );

    expect(getByText('USDC')).toBeInTheDocument();
  });

  it('falls back to the metadata name when no symbol is available', () => {
    mockUseTokensData.mockReturnValue({
      [STELLAR_USDC_ASSET.toLowerCase()]: {
        assetId: STELLAR_USDC_ASSET,
        iconUrl: '',
        name: 'USD Coin',
      } as TokenAsset,
    });

    const { getByText } = render(
      <TokenHeader token={{ assetId: STELLAR_USDC_ASSET, direction: 'out' }} />,
    );

    expect(getByText('USD Coin')).toBeInTheDocument();
  });

  it('falls back to the generic token label when there is no symbol, name, or metadata', () => {
    const { getByText } = render(
      <TokenHeader token={{ assetId: STELLAR_USDC_ASSET, direction: 'out' }} />,
    );

    expect(getByText(messages.token.message)).toBeInTheDocument();
  });

  it('handles a missing token by requesting no metadata and rendering the generic label', () => {
    const { getByText, getByTestId } = render(
      <TokenHeader token={undefined} />,
    );

    expect(mockUseTokensData).toHaveBeenCalledWith([]);
    expect(getByText(messages.token.message)).toBeInTheDocument();
    expect(getByTestId('activity-avatar')).toHaveTextContent(
      JSON.stringify([null]),
    );
  });
});
