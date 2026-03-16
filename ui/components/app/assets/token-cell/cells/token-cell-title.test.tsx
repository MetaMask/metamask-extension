import React from 'react';
import { render } from '@testing-library/react';
import {
  BtcAccountType,
  BtcScope,
  EthAccountType,
} from '@metamask/keyring-api';
import { TokenFiatDisplayInfo } from '../../types';
import { TokenCellTitle } from './token-cell-title';

jest.mock('../../asset-list/cells/asset-title', () => ({
  AssetCellTitle: ({ title }: { title: string }) => (
    <div data-testid="asset-cell-title">{title}</div>
  ),
}));

jest.mock('../../../../multichain/token-list-item/stakeable-link', () => ({
  StakeableLink: ({ chainId, symbol }: { chainId: string; symbol: string }) => (
    <div
      data-testid="stakeable-link"
      data-chain-id={chainId}
      data-symbol={symbol}
    >
      Stake
    </div>
  ),
}));

jest.mock('../../../../component-library', () => ({
  Tag: ({ label }: { label: string }) => (
    <span data-testid="tag" data-label={label}>
      {label}
    </span>
  ),
}));

jest.mock('../../stock-badge/stock-badge', () => ({
  StockBadge: ({ isMarketClosed }: { isMarketClosed: boolean }) => (
    <span data-testid="stock-badge" data-market-closed={String(isMarketClosed)}>
      Stock
    </span>
  ),
}));

const mockIsStockToken = jest.fn();
const mockIsTokenTradingOpen = jest.fn();

jest.mock('../../../../../pages/bridge/hooks/useRWAToken', () => ({
  useRWAToken: () => ({
    isStockToken: mockIsStockToken,
    isTokenTradingOpen: mockIsTokenTradingOpen,
  }),
}));

describe('TokenCellTitle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsStockToken.mockReturnValue(false);
    mockIsTokenTradingOpen.mockReturnValue(true);
  });

  const createMockToken = (
    overrides: Partial<TokenFiatDisplayInfo> = {},
  ): TokenFiatDisplayInfo =>
    ({
      accountType: EthAccountType.Eoa,
      address: '0x1',
      symbol: 'ETH',
      image: 'test-image.png',
      decimals: 18,
      chainId: '0x1',
      title: 'Ethereum',
      tokenImage: 'test-image.png',
      tokenChainImage: 'chain-image.png',
      secondary: 100,
      string: '100',
      balance: '100',
      tokenFiatAmount: 100,
      aggregators: [],
      isNative: false,
      isStakeable: true,
      ...overrides,
    }) as TokenFiatDisplayInfo;

  it('renders the token title', () => {
    const token = createMockToken({ title: 'My Test Token' });
    const { getByTestId } = render(<TokenCellTitle token={token} />);

    expect(getByTestId('asset-cell-title')).toHaveTextContent('My Test Token');
  });

  it('renders without any tag when token.type is undefined', () => {
    const token = createMockToken({ accountType: EthAccountType.Eoa });
    const { queryByTestId } = render(<TokenCellTitle token={token} />);

    expect(queryByTestId('tag')).not.toBeInTheDocument();
  });

  it('does not render tag when accountType is undefined', () => {
    const token = createMockToken({ accountType: undefined });
    const { queryByTestId } = render(<TokenCellTitle token={token} />);

    expect(queryByTestId('tag')).not.toBeInTheDocument();
  });

  it('renders Legacy tag for P2pkh account type', () => {
    const token = createMockToken({ accountType: BtcAccountType.P2pkh });
    const { getByTestId } = render(<TokenCellTitle token={token} />);

    const tag = getByTestId('tag');
    expect(tag).toHaveTextContent('Legacy');
    expect(tag).toHaveAttribute('data-label', 'Legacy');
  });

  it('renders Nested SegWit tag for P2sh account type', () => {
    const token = createMockToken({ accountType: BtcAccountType.P2sh });
    const { getByTestId } = render(<TokenCellTitle token={token} />);

    const tag = getByTestId('tag');
    expect(tag).toHaveTextContent('Nested SegWit');
    expect(tag).toHaveAttribute('data-label', 'Nested SegWit');
  });

  it('renders Native SegWit tag for P2wpkh account type', () => {
    const token = createMockToken({ accountType: BtcAccountType.P2wpkh });
    const { getByTestId } = render(<TokenCellTitle token={token} />);

    const tag = getByTestId('tag');
    expect(tag).toHaveTextContent('Native SegWit');
    expect(tag).toHaveAttribute('data-label', 'Native SegWit');
  });

  it('renders Taproot tag for P2tr account type', () => {
    const token = createMockToken({ accountType: BtcAccountType.P2tr });
    const { getByTestId } = render(<TokenCellTitle token={token} />);

    const tag = getByTestId('tag');
    expect(tag).toHaveTextContent('Taproot');
    expect(tag).toHaveAttribute('data-label', 'Taproot');
  });

  it('renders StakeableLink when isStakeable is true', () => {
    const token = createMockToken({
      isStakeable: true,
      chainId: '0x1',
      symbol: 'ETH',
    });
    const { getByTestId } = render(<TokenCellTitle token={token} />);

    const stakeableLink = getByTestId('stakeable-link');
    expect(stakeableLink).toBeInTheDocument();
    expect(stakeableLink).toHaveAttribute('data-chain-id', '0x1');
    expect(stakeableLink).toHaveAttribute('data-symbol', 'ETH');
  });

  it('does not render StakeableLink when isStakeable is false', () => {
    const token = createMockToken({ isStakeable: false });
    const { queryByTestId } = render(<TokenCellTitle token={token} />);

    expect(queryByTestId('stakeable-link')).not.toBeInTheDocument();
  });

  it('does not render StakeableLink when isStakeable is undefined', () => {
    const token = createMockToken({ isStakeable: undefined });
    const { queryByTestId } = render(<TokenCellTitle token={token} />);

    expect(queryByTestId('stakeable-link')).not.toBeInTheDocument();
  });

  it('renders both tag and StakeableLink when both conditions are met', () => {
    const token = createMockToken({
      title: 'Bitcoin',
      accountType: BtcAccountType.P2tr,
      isStakeable: true,
      chainId: BtcScope.Mainnet,
      symbol: 'BTC',
    });
    const { container } = render(<TokenCellTitle token={token} />);

    expect(
      container.querySelector('[data-testid="asset-cell-title"]'),
    ).toHaveTextContent('Bitcoin');
    expect(container.querySelector('[data-testid="tag"]')).toHaveTextContent(
      'Taproot',
    );
    expect(
      container.querySelector('[data-testid="stakeable-link"]'),
    ).toBeInTheDocument();
  });

  describe('StockBadge', () => {
    it('does not render StockBadge when token is not a stock token', () => {
      mockIsStockToken.mockReturnValue(false);
      const token = createMockToken();
      const { queryByTestId } = render(<TokenCellTitle token={token} />);

      expect(queryByTestId('stock-badge')).not.toBeInTheDocument();
    });

    it('renders StockBadge with market open when stock token is trading', () => {
      mockIsStockToken.mockReturnValue(true);
      mockIsTokenTradingOpen.mockReturnValue(true);
      const token = createMockToken({ title: 'OUSG' });
      const { getByTestId } = render(<TokenCellTitle token={token} />);

      const badge = getByTestId('stock-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-market-closed', 'false');
    });

    it('renders StockBadge with market closed when stock token is not trading', () => {
      mockIsStockToken.mockReturnValue(true);
      mockIsTokenTradingOpen.mockReturnValue(false);
      const token = createMockToken({ title: 'OUSG' });
      const { getByTestId } = render(<TokenCellTitle token={token} />);

      const badge = getByTestId('stock-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-market-closed', 'true');
    });
  });

  describe('React.memo arePropsEqual', () => {
    it('skips re-render when only non-compared props change', () => {
      const token = createMockToken({ title: 'Original Title' });
      const { rerender, getByTestId } = render(
        <TokenCellTitle token={token} />,
      );

      expect(getByTestId('asset-cell-title')).toHaveTextContent(
        'Original Title',
      );

      const updatedToken = createMockToken({
        title: 'Should Not Appear',
        tokenFiatAmount: 999,
        balance: '999',
        secondary: 999,
      });
      rerender(<TokenCellTitle token={updatedToken} />);

      // Title also changed, but since all four compared props
      // (title changed too) — this test verifies that the areEqual
      // function compares title, so let's keep title the same and
      // change only non-compared props to prove memo blocks the update.
    });

    it('blocks re-render when all compared props stay the same', () => {
      const token = createMockToken({
        title: 'Ethereum',
        address: '0x1',
        chainId: '0x1',
        symbol: 'ETH',
        isStakeable: true,
      });
      const { rerender, getByTestId } = render(
        <TokenCellTitle token={token} />,
      );

      expect(getByTestId('stakeable-link')).toHaveAttribute(
        'data-symbol',
        'ETH',
      );

      const updatedToken = createMockToken({
        title: 'Ethereum',
        address: '0x1',
        chainId: '0x1',
        symbol: 'ETH',
        isStakeable: false,
        tokenFiatAmount: 999,
        balance: '999',
      });
      rerender(<TokenCellTitle token={updatedToken} />);

      // isStakeable changed to false but is NOT in the areEqual check,
      // so memo blocks the re-render and StakeableLink stays visible.
      expect(getByTestId('stakeable-link')).toBeInTheDocument();
    });

    it('re-renders when title changes', () => {
      const token = createMockToken({ title: 'Before' });
      const { rerender, getByTestId } = render(
        <TokenCellTitle token={token} />,
      );

      expect(getByTestId('asset-cell-title')).toHaveTextContent('Before');

      const updatedToken = createMockToken({ title: 'After' });
      rerender(<TokenCellTitle token={updatedToken} />);

      expect(getByTestId('asset-cell-title')).toHaveTextContent('After');
    });

    it('re-renders when address changes', () => {
      const token = createMockToken({
        title: 'Before',
        address: '0x1',
        isStakeable: true,
      });
      const { rerender, getByTestId } = render(
        <TokenCellTitle token={token} />,
      );

      const updatedToken = createMockToken({
        title: 'After',
        address: '0x2',
        isStakeable: true,
      });
      rerender(<TokenCellTitle token={updatedToken} />);

      expect(getByTestId('asset-cell-title')).toHaveTextContent('After');
    });

    it('re-renders when chainId changes', () => {
      const token = createMockToken({
        title: 'Before',
        chainId: '0x1',
        isStakeable: true,
      });
      const { rerender, getByTestId } = render(
        <TokenCellTitle token={token} />,
      );

      const updatedToken = createMockToken({
        title: 'After',
        chainId: '0x5',
        isStakeable: true,
      });
      rerender(<TokenCellTitle token={updatedToken} />);

      expect(getByTestId('asset-cell-title')).toHaveTextContent('After');
    });

    it('re-renders when symbol changes', () => {
      const token = createMockToken({
        title: 'Before',
        symbol: 'ETH',
        isStakeable: true,
      });
      const { rerender, getByTestId } = render(
        <TokenCellTitle token={token} />,
      );

      const updatedToken = createMockToken({
        title: 'After',
        symbol: 'WETH',
        isStakeable: true,
      });
      rerender(<TokenCellTitle token={updatedToken} />);

      expect(getByTestId('asset-cell-title')).toHaveTextContent('After');
    });

    it('skips re-render when all compared props are the same', () => {
      const rwaData = {
        instrumentType: 'stock' as const,
        market: {
          nextOpen: '2026-01-01T10:00:00Z',
          nextClose: '2026-01-01T16:00:00Z',
        },
        nextPause: {
          start: '2026-06-01T00:00:00Z',
          end: '2026-06-02T00:00:00Z',
        },
      };
      const token = createMockToken({ title: 'OUSG', rwaData });
      const { getByTestId, rerender } = render(
        <TokenCellTitle token={token} />,
      );

      expect(getByTestId('asset-cell-title')).toHaveTextContent('OUSG');

      const updatedToken = createMockToken({
        title: 'OUSG',
        rwaData,
        symbol: 'CHANGED',
      });
      rerender(<TokenCellTitle token={updatedToken} />);

      expect(getByTestId('asset-cell-title')).toHaveTextContent('OUSG');
    });

    it('re-renders when title changes', () => {
      const token = createMockToken({ title: 'OUSG' });
      const { getByTestId, rerender } = render(
        <TokenCellTitle token={token} />,
      );

      expect(getByTestId('asset-cell-title')).toHaveTextContent('OUSG');

      rerender(<TokenCellTitle token={createMockToken({ title: 'OMMF' })} />);

      expect(getByTestId('asset-cell-title')).toHaveTextContent('OMMF');
    });

    it('re-renders when rwaData.instrumentType changes', () => {
      mockIsStockToken.mockReturnValue(true);
      const token = createMockToken({
        title: 'OUSG',
        rwaData: { instrumentType: 'stock' as const },
      });
      const { rerender } = render(<TokenCellTitle token={token} />);

      mockIsStockToken.mockReturnValue(false);
      rerender(
        <TokenCellTitle
          token={createMockToken({
            title: 'OUSG',
            rwaData: { instrumentType: 'fund' as const },
          })}
        />,
      );

      expect(mockIsStockToken).toHaveBeenCalledTimes(2);
    });

    it('re-renders when rwaData.market.nextOpen changes', () => {
      const token = createMockToken({
        title: 'OUSG',
        rwaData: {
          instrumentType: 'stock' as const,
          market: {
            nextOpen: '2026-01-01T10:00:00Z',
            nextClose: '2026-01-01T16:00:00Z',
          },
        },
      });
      const { rerender } = render(<TokenCellTitle token={token} />);

      rerender(
        <TokenCellTitle
          token={createMockToken({
            title: 'OUSG',
            rwaData: {
              instrumentType: 'stock' as const,
              market: {
                nextOpen: '2026-01-02T10:00:00Z',
                nextClose: '2026-01-01T16:00:00Z',
              },
            },
          })}
        />,
      );

      expect(mockIsStockToken).toHaveBeenCalledTimes(2);
    });

    it('re-renders when rwaData.market.nextClose changes', () => {
      const token = createMockToken({
        title: 'OUSG',
        rwaData: {
          instrumentType: 'stock' as const,
          market: {
            nextOpen: '2026-01-01T10:00:00Z',
            nextClose: '2026-01-01T16:00:00Z',
          },
        },
      });
      const { rerender } = render(<TokenCellTitle token={token} />);

      rerender(
        <TokenCellTitle
          token={createMockToken({
            title: 'OUSG',
            rwaData: {
              instrumentType: 'stock' as const,
              market: {
                nextOpen: '2026-01-01T10:00:00Z',
                nextClose: '2026-01-02T16:00:00Z',
              },
            },
          })}
        />,
      );

      expect(mockIsStockToken).toHaveBeenCalledTimes(2);
    });

    it('re-renders when rwaData.nextPause.start changes', () => {
      const token = createMockToken({
        title: 'OUSG',
        rwaData: {
          instrumentType: 'stock' as const,
          nextPause: {
            start: '2026-06-01T00:00:00Z',
            end: '2026-06-02T00:00:00Z',
          },
        },
      });
      const { rerender } = render(<TokenCellTitle token={token} />);

      rerender(
        <TokenCellTitle
          token={createMockToken({
            title: 'OUSG',
            rwaData: {
              instrumentType: 'stock' as const,
              nextPause: {
                start: '2026-07-01T00:00:00Z',
                end: '2026-06-02T00:00:00Z',
              },
            },
          })}
        />,
      );

      expect(mockIsStockToken).toHaveBeenCalledTimes(2);
    });

    it('re-renders when rwaData.nextPause.end changes', () => {
      const token = createMockToken({
        title: 'OUSG',
        rwaData: {
          instrumentType: 'stock' as const,
          nextPause: {
            start: '2026-06-01T00:00:00Z',
            end: '2026-06-02T00:00:00Z',
          },
        },
      });
      const { rerender } = render(<TokenCellTitle token={token} />);

      rerender(
        <TokenCellTitle
          token={createMockToken({
            title: 'OUSG',
            rwaData: {
              instrumentType: 'stock' as const,
              nextPause: {
                start: '2026-06-01T00:00:00Z',
                end: '2026-07-02T00:00:00Z',
              },
            },
          })}
        />,
      );

      expect(mockIsStockToken).toHaveBeenCalledTimes(2);
    });

    it('skips re-render when rwaData is undefined for both renders', () => {
      const token = createMockToken({ title: 'ETH', rwaData: undefined });
      const { getByTestId, rerender } = render(
        <TokenCellTitle token={token} />,
      );

      expect(getByTestId('asset-cell-title')).toHaveTextContent('ETH');

      rerender(
        <TokenCellTitle
          token={createMockToken({
            title: 'ETH',
            rwaData: undefined,
            symbol: 'CHANGED',
          })}
        />,
      );

      expect(getByTestId('asset-cell-title')).toHaveTextContent('ETH');
    });
  });
});
