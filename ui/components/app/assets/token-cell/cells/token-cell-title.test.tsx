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

describe('TokenCellTitle', () => {
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
});
