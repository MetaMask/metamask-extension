import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { buildBatchSellAsset } from '../../../../../../test/data/batch-sell';
import { TotalReceivedModal } from './total-received-modal';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('./assets-received-summary-list', () => ({
  AssetsReceivedSummaryList: ({
    receivedAsset,
    quotes,
  }: {
    receivedAsset: { symbol: string };
    quotes?: Record<string, unknown>;
  }) => (
    <div data-testid="summary-list">
      summary-list-for-{receivedAsset.symbol}-quotes:
      {Object.keys(quotes ?? {}).length}
    </div>
  ),
}));

jest.mock('./assets-received-total-amounts-summary', () => ({
  AssetsReceivedTotalAmountsSummary: ({
    totalReceivedAmount,
    minimumReceivedAmount,
    isLoading,
  }: {
    totalReceivedAmount?: number;
    minimumReceivedAmount?: number;
    isLoading?: boolean;
  }) => (
    <div data-testid="totals-summary">
      total:{String(totalReceivedAmount)}-min:{String(minimumReceivedAmount)}
      -loading:{String(isLoading)}
    </div>
  ),
}));

const ASSET_A = 'eip155:1/erc20:0xAAA' as CaipAssetType;

const sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'] = {
  [ASSET_A]: {
    asset: buildBatchSellAsset({
      assetId: ASSET_A,
      symbol: 'AAA',
      name: 'Token A',
      balance: '1',
    }) as never,
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
        quotesAreFetching={false}
        anyEnabledAsset={false}
        atLeastOneQuoteAvailable={false}
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
        quotesAreFetching={false}
        anyEnabledAsset={false}
        atLeastOneQuoteAvailable={false}
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
        quotesAreFetching={false}
        anyEnabledAsset={false}
        atLeastOneQuoteAvailable={false}
      />,
    );

    expect(screen.getByTestId('summary-list')).toHaveTextContent(
      'summary-list-for-USDC',
    );
  });

  it('forwards quotes to AssetsReceivedSummaryList', () => {
    const ASSET_B = 'eip155:1/erc20:0xBBB' as CaipAssetType;
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: {} as never,
        hasQuote: true,
        isLoadingQuote: false,
      },
      [ASSET_B]: {
        asset: {} as never,
        quote: {} as never,
        hasQuote: true,
        isLoadingQuote: false,
      },
    };

    render(
      <TotalReceivedModal
        open
        onClose={jest.fn()}
        sendAssetsConfig={sendAssetsConfig}
        receivedAsset={{ symbol: 'USDC' }}
        quotes={quotes}
        quotesAreFetching={false}
        anyEnabledAsset={true}
        atLeastOneQuoteAvailable={true}
      />,
    );

    expect(screen.getByTestId('summary-list')).toHaveTextContent('quotes:2');
  });

  it('calls onClose when the modal header close button is clicked', () => {
    const onClose = jest.fn();

    render(
      <TotalReceivedModal
        open
        onClose={onClose}
        sendAssetsConfig={sendAssetsConfig}
        receivedAsset={{ symbol: 'USDC' }}
        quotesAreFetching={false}
        anyEnabledAsset={false}
        atLeastOneQuoteAvailable={false}
      />,
    );

    const closeButton = screen
      .getAllByRole('button')
      .find((el) => el.getAttribute('aria-label')?.toLowerCase() === 'close');

    expect(closeButton).toBeDefined();
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
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
        quotesAreFetching={false}
        anyEnabledAsset={false}
        atLeastOneQuoteAvailable={false}
      />,
    );

    expect(screen.getByTestId('totals-summary')).toHaveTextContent(
      'total:100-min:95',
    );
  });

  describe('isLoading passed to AssetsReceivedTotalAmountsSummary', () => {
    it('is true when quotes are fetching, any asset is enabled, and no quote is available yet', () => {
      render(
        <TotalReceivedModal
          open
          onClose={jest.fn()}
          sendAssetsConfig={sendAssetsConfig}
          receivedAsset={{ symbol: 'USDC' }}
          quotesAreFetching={true}
          anyEnabledAsset={true}
          atLeastOneQuoteAvailable={false}
        />,
      );

      expect(screen.getByTestId('totals-summary')).toHaveTextContent(
        'loading:true',
      );
    });

    it('is false when quotes are not fetching', () => {
      render(
        <TotalReceivedModal
          open
          onClose={jest.fn()}
          sendAssetsConfig={sendAssetsConfig}
          receivedAsset={{ symbol: 'USDC' }}
          quotesAreFetching={false}
          anyEnabledAsset={true}
          atLeastOneQuoteAvailable={false}
        />,
      );

      expect(screen.getByTestId('totals-summary')).toHaveTextContent(
        'loading:false',
      );
    });

    it('is false when no asset is enabled', () => {
      render(
        <TotalReceivedModal
          open
          onClose={jest.fn()}
          sendAssetsConfig={sendAssetsConfig}
          receivedAsset={{ symbol: 'USDC' }}
          quotesAreFetching={true}
          anyEnabledAsset={false}
          atLeastOneQuoteAvailable={false}
        />,
      );

      expect(screen.getByTestId('totals-summary')).toHaveTextContent(
        'loading:false',
      );
    });

    it('is false when at least one quote is already available', () => {
      render(
        <TotalReceivedModal
          open
          onClose={jest.fn()}
          sendAssetsConfig={sendAssetsConfig}
          receivedAsset={{ symbol: 'USDC' }}
          quotesAreFetching={true}
          anyEnabledAsset={true}
          atLeastOneQuoteAvailable={true}
        />,
      );

      expect(screen.getByTestId('totals-summary')).toHaveTextContent(
        'loading:false',
      );
    });
  });
});
