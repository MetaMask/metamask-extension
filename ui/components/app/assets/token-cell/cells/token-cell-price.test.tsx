import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useCachedPrice } from '../../../../../pages/asset/hooks/useCurrentPrice';
import { AssetType } from '../../../../../../shared/constants/transaction';
import type { TokenFiatDisplayInfo } from '../../types';
import { TokenCellPrice } from './token-cell-price';

jest.mock('../../../../../pages/asset/hooks/useCurrentPrice');

const mockUseCachedPrice = jest.mocked(useCachedPrice);

const createToken = (
  overrides: Partial<TokenFiatDisplayInfo> = {},
): TokenFiatDisplayInfo =>
  ({
    chainId: '0x1',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    image: '',
    isFiatLoading: false,
    ...overrides,
  }) as unknown as TokenFiatDisplayInfo;

const renderPrice = (
  token: TokenFiatDisplayInfo,
  metamask: Record<string, unknown> = {},
) =>
  renderWithProvider(
    <TokenCellPrice token={token} />,
    configureStore({
      metamask: {
        ...mockState.metamask,
        currentCurrency: 'usd',
        useCurrencyRateCheck: true,
        ...metamask,
      },
    }),
  );

describe('TokenCellPrice', () => {
  it('renders the cached price in the current currency', () => {
    mockUseCachedPrice.mockReturnValue({ currentPrice: 1234.5 });

    const { getByTestId } = renderPrice(createToken());

    expect(getByTestId('multichain-token-list-item-price')).toHaveTextContent(
      '$1,234.50',
    );
  });

  it('renders a dash when no price is available', () => {
    mockUseCachedPrice.mockReturnValue({ currentPrice: undefined });

    const { getByTestId } = renderPrice(createToken());

    expect(getByTestId('multichain-token-list-item-price')).toHaveTextContent(
      '—',
    );
  });

  it('renders a dash when currency rate checks are disabled', () => {
    mockUseCachedPrice.mockReturnValue({ currentPrice: 1 });

    const { getByTestId } = renderPrice(createToken(), {
      useCurrencyRateCheck: false,
    });

    expect(getByTestId('multichain-token-list-item-price')).toHaveTextContent(
      '—',
    );
  });

  it('renders a skeleton while the fiat values load', () => {
    mockUseCachedPrice.mockReturnValue({ currentPrice: undefined });

    const { getByTestId, queryByTestId } = renderPrice(
      createToken({ isFiatLoading: true }),
    );

    expect(
      getByTestId('multichain-token-list-item-price-skeleton'),
    ).toBeInTheDocument();
    expect(
      queryByTestId('multichain-token-list-item-price'),
    ).not.toBeInTheDocument();
  });

  it('looks up native tokens as native assets', () => {
    mockUseCachedPrice.mockReturnValue({ currentPrice: 2000 });

    renderPrice(createToken({ isNative: true, symbol: 'ETH', decimals: 18 }));

    expect(mockUseCachedPrice).toHaveBeenCalledWith(
      expect.objectContaining({ type: AssetType.native, symbol: 'ETH' }),
    );
  });
});
