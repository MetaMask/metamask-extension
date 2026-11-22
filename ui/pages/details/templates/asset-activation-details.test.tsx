import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { AssetActivationDetails } from './asset-activation-details';

jest.mock('../components/token-header', () => ({
  TokenHeader: ({ token }: { token?: { symbol?: string } }) => (
    <div data-testid="token-header">{token?.symbol}</div>
  ),
}));

jest.mock('../components/sections', () => ({
  MetadataSection: () => <div data-testid="metadata-section" />,
}));

jest.mock('../components/amounts-section', () => ({
  FeesRows: () => <div data-testid="fees-rows" />,
  TotalAmountRow: ({ token }: { token?: { symbol?: string } }) => (
    <div data-testid="total-amount-row">{token?.symbol}</div>
  ),
}));

jest.mock('../components/shared', () => ({
  Footer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="footer">{children}</div>
  ),
  Section: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
}));

jest.mock('../components/block-explorer-button', () => ({
  BlockExplorerButton: ({
    chainId,
    txHash,
  }: {
    chainId: string;
    txHash?: string;
  }) => (
    <div
      data-testid="block-explorer-button"
      data-chain-id={chainId}
      data-tx-hash={txHash}
    />
  ),
}));

const STELLAR_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

type AssetActivationItem = Extract<
  ActivityListItem,
  { type: 'assetActivation' | 'assetDeactivation' }
>;

const buildItem = (
  overrides: Partial<AssetActivationItem> = {},
): AssetActivationItem =>
  ({
    type: 'assetActivation',
    chainId: 'stellar:pubnet',
    status: 'success',
    timestamp: 1716367781000,
    hash: 'trustline-approve-id',
    data: {
      from: 'owner-address',
      token: {
        assetId: STELLAR_USDC_ASSET,
        symbol: 'USDC',
        direction: 'out',
      },
    },
    ...overrides,
  }) as AssetActivationItem;

describe('AssetActivationDetails', () => {
  it('renders the token header and total amount row with the activity token', () => {
    const { getByTestId } = render(
      <AssetActivationDetails item={buildItem()} />,
    );

    expect(getByTestId('token-header')).toHaveTextContent('USDC');
    expect(getByTestId('total-amount-row')).toHaveTextContent('USDC');
  });

  it('renders the metadata and fees sections', () => {
    const { getByTestId } = render(
      <AssetActivationDetails item={buildItem()} />,
    );

    expect(getByTestId('metadata-section')).toBeInTheDocument();
    expect(getByTestId('fees-rows')).toBeInTheDocument();
  });

  it('renders a block explorer button with the transaction chain id and hash', () => {
    const { getByTestId } = render(
      <AssetActivationDetails item={buildItem()} />,
    );

    const button = getByTestId('block-explorer-button');
    expect(button).toHaveAttribute('data-chain-id', 'stellar:pubnet');
    expect(button).toHaveAttribute('data-tx-hash', 'trustline-approve-id');
  });

  it('supports asset deactivation activity items', () => {
    const { getByTestId } = render(
      <AssetActivationDetails
        item={buildItem({
          type: 'assetDeactivation',
          hash: 'trustline-disapprove-id',
        })}
      />,
    );

    expect(getByTestId('token-header')).toHaveTextContent('USDC');
    expect(getByTestId('block-explorer-button')).toHaveAttribute(
      'data-tx-hash',
      'trustline-disapprove-id',
    );
  });
});
