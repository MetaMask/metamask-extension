import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { buildBatchSellAsset } from '../../../../../../test/data/batch-sell';
import { AssetsReceivedSummaryList } from './assets-received-summary-list';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../ducks/locale/locale', () => ({
  getIntlLocale: (state: { locale?: string }) => state?.locale,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

beforeEach(() => {
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValue('en-US' as never);
});

const ASSET_A = 'eip155:1/erc20:0xAAA' as CaipAssetType;
const ASSET_B = 'eip155:1/erc20:0xBBB' as CaipAssetType;

function makeSendAssetsConfig(
  overrides: Partial<
    Record<
      CaipAssetType,
      Partial<BatchSellQuotesConfig['sendAssetsConfig'][CaipAssetType]>
    >
  > = {},
): BatchSellQuotesConfig['sendAssetsConfig'] {
  return {
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
      ...overrides[ASSET_A],
    },
    [ASSET_B]: {
      asset: buildBatchSellAsset({
        assetId: ASSET_B,
        symbol: 'BBB',
        name: 'Token B',
        balance: '1',
      }) as never,
      sendAmountPercent: 100,
      slippagePercent: 2,
      enabled: true,
      ...overrides[ASSET_B],
    },
  };
}

describe('AssetsReceivedSummaryList', () => {
  it('renders one row per enabled asset', () => {
    render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig()}
        quotes={undefined}
      />,
    );

    expect(screen.getByText(/AAA/u)).toBeInTheDocument();
    expect(screen.getByText(/BBB/u)).toBeInTheDocument();
  });

  it('filters out disabled assets', () => {
    render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig({
          [ASSET_B]: { enabled: false },
        })}
        quotes={undefined}
      />,
    );

    expect(screen.getByText(/AAA/u)).toBeInTheDocument();
    expect(screen.queryByText(/BBB/u)).not.toBeInTheDocument();
  });

  it('renders the slippage percent for each item', () => {
    render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig()}
        quotes={undefined}
      />,
    );

    expect(screen.getByText(/0\.5%/u)).toBeInTheDocument();
    expect(screen.getByText(/2%/u)).toBeInTheDocument();
  });

  it('renders the received amount when quote is provided', () => {
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: {} as never,
        receivedAmount: 100,
        hasQuote: true,
        isLoadingQuote: false,
      },
    };

    render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig({
          [ASSET_B]: { enabled: false },
        })}
        quotes={quotes}
      />,
    );

    expect(screen.getByText(/100/u)).toBeInTheDocument();
  });

  it('renders rows independently: a settled slot shows its amount while a still-loading slot shows the skeleton', () => {
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: {} as never,
        receivedAmount: 42,
        hasQuote: true,
        isLoadingQuote: false,
      },
      [ASSET_B]: {
        asset: {} as never,
        quote: null as never,
        hasQuote: false,
        isLoadingQuote: true,
      },
    };

    const { container } = render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig()}
        quotes={quotes}
      />,
    );

    expect(screen.getByText(/42/u)).toBeInTheDocument();
    expect(container.querySelector('.mm-skeleton')).not.toBeNull();
  });

  it('renders nothing when all assets are disabled', () => {
    const { container } = render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig({
          [ASSET_A]: { enabled: false },
          [ASSET_B]: { enabled: false },
        })}
        quotes={undefined}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('hides a row whose quote has settled with no quote available', () => {
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: {} as never,
        receivedAmount: 100,
        hasQuote: true,
        isLoadingQuote: false,
      },
      [ASSET_B]: {
        asset: {} as never,
        quote: null as never,
        hasQuote: false,
        isLoadingQuote: false,
      },
    };

    render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig()}
        quotes={quotes}
      />,
    );

    expect(screen.getByText(/AAA/u)).toBeInTheDocument();
    expect(screen.queryByText(/BBB/u)).not.toBeInTheDocument();
  });

  it('hides all rows when every quote has settled with no quote available', () => {
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: null as never,
        hasQuote: false,
        isLoadingQuote: false,
      },
      [ASSET_B]: {
        asset: {} as never,
        quote: null as never,
        hasQuote: false,
        isLoadingQuote: false,
      },
    };

    const { container } = render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig()}
        quotes={quotes}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps rendering rows whose quote is still loading even when another row has no quote', () => {
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: null as never,
        hasQuote: false,
        isLoadingQuote: true,
      },
      [ASSET_B]: {
        asset: {} as never,
        quote: null as never,
        hasQuote: false,
        isLoadingQuote: false,
      },
    };

    const { container } = render(
      <AssetsReceivedSummaryList
        receivedAsset={{ symbol: 'USDC' }}
        sendAssetsConfig={makeSendAssetsConfig()}
        quotes={quotes}
      />,
    );

    expect(screen.getByText(/AAA/u)).toBeInTheDocument();
    expect(screen.queryByText(/BBB/u)).not.toBeInTheDocument();
    expect(container.querySelector('.mm-skeleton')).not.toBeNull();
  });
});
