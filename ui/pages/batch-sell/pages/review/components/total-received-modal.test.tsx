import React from 'react';
import { render, screen } from '@testing-library/react';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig } from '../types';
import { TotalReceivedModal } from './total-received-modal';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('./assets-received-summary-list', () => ({
  AssetsReceivedSummaryList: ({
    receivedAsset,
  }: {
    receivedAsset: { symbol: string };
  }) => (
    <div data-testid="summary-list">
      summary-list-for-{receivedAsset.symbol}
    </div>
  ),
}));

jest.mock('./assets-received-total-amounts-summary', () => ({
  AssetsReceivedTotalAmountsSummary: ({
    totalReceivedAmount,
    minimumReceivedAmount,
  }: {
    totalReceivedAmount?: number;
    minimumReceivedAmount?: number;
  }) => (
    <div data-testid="totals-summary">
      total:{String(totalReceivedAmount)}-min:{String(minimumReceivedAmount)}
    </div>
  ),
}));

const ASSET_A = 'eip155:1/erc20:0xAAA' as CaipAssetType;

const sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'] = {
  [ASSET_A]: {
    asset: {
      assetId: ASSET_A,
      symbol: 'AAA',
      name: 'Token A',
      chainId: 'eip155:1',
      balance: '1',
      decimals: 18,
      iconUrl: '',
    } as never,
    sendAmountPercent: 100,
    slippagePercent: 0.5,
    enabled: true,
  },
};

describe('TotalReceivedModal', () => {
  it('does not render content when open is false', () => {
    render(
      <TotalReceivedModal
        open={false}
        onClose={jest.fn()}
        sendAssetsConfig={sendAssetsConfig}
        receivedAsset={{ symbol: 'USDC' }}
      />,
    );

    expect(screen.queryByTestId('summary-list')).not.toBeInTheDocument();
  });

  it('renders the modal title when open', () => {
    render(
      <TotalReceivedModal
        open
        onClose={jest.fn()}
        sendAssetsConfig={sendAssetsConfig}
        receivedAsset={{ symbol: 'USDC' }}
      />,
    );

    expect(screen.getByText('totalReceived')).toBeInTheDocument();
  });

  it('renders the summary list with the received asset', () => {
    render(
      <TotalReceivedModal
        open
        onClose={jest.fn()}
        sendAssetsConfig={sendAssetsConfig}
        receivedAsset={{ symbol: 'USDC' }}
      />,
    );

    expect(screen.getByTestId('summary-list')).toHaveTextContent(
      'summary-list-for-USDC',
    );
  });

  it('forwards the totals to AssetsReceivedTotalAmountsSummary', () => {
    render(
      <TotalReceivedModal
        open
        onClose={jest.fn()}
        sendAssetsConfig={sendAssetsConfig}
        receivedAsset={{ symbol: 'USDC' }}
        totalReceivedAmount={100}
        minimumReceivedAmount={95}
      />,
    );

    expect(screen.getByTestId('totals-summary')).toHaveTextContent(
      'total:100-min:95',
    );
  });
});
