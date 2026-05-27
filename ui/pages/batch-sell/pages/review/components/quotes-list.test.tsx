import React from 'react';
import { render, screen } from '@testing-library/react';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig } from '../types';
import { buildBatchSellAsset } from '../../../../../../test/data/batch-sell';
import { QuotesList } from './quotes-list';

jest.mock('./quotes-list-item', () => ({
  QuotesListItem: ({
    asset,
    enabled,
    sendAmountPercent,
  }: {
    asset: { assetId: string; symbol: string };
    enabled: boolean;
    sendAmountPercent: number;
  }) => (
    <div data-testid={`quote-${asset.assetId}`}>
      {asset.symbol}-{String(enabled)}-{sendAmountPercent}
    </div>
  ),
}));

const ASSET_A = 'eip155:1/erc20:0xAAA' as CaipAssetType;
const ASSET_B = 'eip155:1/erc20:0xBBB' as CaipAssetType;

function makeSendAssetsConfig(): BatchSellQuotesConfig['sendAssetsConfig'] {
  return {
    [ASSET_A]: {
      asset: buildBatchSellAsset({
        assetId: ASSET_A,
        symbol: 'AAA',
        name: 'Token A',
        balance: '1',
      }) as never,
      sendAmountPercent: 50,
      slippagePercent: 0.5,
      enabled: true,
    },
    [ASSET_B]: {
      asset: buildBatchSellAsset({
        assetId: ASSET_B,
        symbol: 'BBB',
        name: 'Token B',
        balance: '1',
      }) as never,
      sendAmountPercent: 75,
      slippagePercent: 2,
      enabled: false,
    },
  };
}

describe('QuotesList', () => {
  it('renders one QuotesListItem per asset (including disabled)', () => {
    render(
      <QuotesList
        sendAssetsConfig={makeSendAssetsConfig()}
        canDeleteAssets
        onAssetDeleteClick={jest.fn()}
        onSlippagePercentChangeClick={jest.fn()}
        onSendAmountPercentChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId(`quote-${ASSET_A}`)).toBeInTheDocument();
    expect(screen.getByTestId(`quote-${ASSET_B}`)).toBeInTheDocument();
  });

  it('forwards enabled and sendAmountPercent for each item', () => {
    render(
      <QuotesList
        sendAssetsConfig={makeSendAssetsConfig()}
        canDeleteAssets
        onAssetDeleteClick={jest.fn()}
        onSlippagePercentChangeClick={jest.fn()}
        onSendAmountPercentChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId(`quote-${ASSET_A}`)).toHaveTextContent(
      'AAA-true-50',
    );
    expect(screen.getByTestId(`quote-${ASSET_B}`)).toHaveTextContent(
      'BBB-false-75',
    );
  });

  it('renders nothing when sendAssetsConfig is empty', () => {
    const { container } = render(
      <QuotesList
        sendAssetsConfig={{}}
        canDeleteAssets
        onAssetDeleteClick={jest.fn()}
        onSlippagePercentChangeClick={jest.fn()}
        onSendAmountPercentChange={jest.fn()}
      />,
    );

    expect(container.querySelectorAll('[data-testid^="quote-"]').length).toBe(
      0,
    );
  });
});
