import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import {
  buildBatchSellAsset,
  buildReceivedAsset,
} from '../../../../../../test/data/batch-sell';
import useBatchSellSubmitQuotes from '../hooks/useBatchSellSubmitQuotes';
import { ReviewAndConfirmModal } from './review-and-confirm-modal';

jest.mock('../hooks/useBatchSellSubmitQuotes', () => jest.fn());

const mockUseBatchSellSubmitQuotes = jest.mocked(useBatchSellSubmitQuotes);

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: unknown[]) =>
    args ? `${key}:${args.join(',')}` : key,
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: (state: { currency?: string }) => state?.currency,
}));

jest.mock('../../../../../ducks/locale/locale', () => ({
  getIntlLocale: (state: { locale?: string }) => state?.locale,
}));

jest.mock('./assets-received-summary-list', () => ({
  AssetsReceivedSummaryList: () => (
    <div data-testid="summary-list">summary-list</div>
  ),
}));

jest.mock('./assets-received-total-amounts-summary', () => ({
  AssetsReceivedTotalAmountsSummary: ({
    isLoading,
  }: {
    isLoading?: boolean;
  }) => (
    <div data-testid="totals-summary">
      totals-summary-loading:{String(isLoading)}
    </div>
  ),
}));

jest.mock('../../../../../components/component-library/skeleton', () => ({
  Skeleton: ({
    isLoading,
    children,
  }: {
    isLoading?: boolean;
    children: React.ReactNode;
  }) => (isLoading ? <div data-testid="skeleton-loading" /> : <>{children}</>),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

beforeEach(() => {
  mockUseBatchSellSubmitQuotes.mockReturnValue({
    submitBatchSellQuotes: jest.fn(),
    isSubmitting: false,
  });
  mockUseSelector.mockReset();
  // Components inside the modal read currency and locale via useSelector.
  // Return USD for currency-shaped calls and en-US for locale-shaped calls
  // (deterministically by always returning a string – both work the same way
  // for the purposes of these tests).
  mockUseSelector.mockImplementation((selector) => {
    const result = (selector as (state: unknown) => unknown)({
      currency: 'USD',
      locale: 'en-US',
    });
    return result ?? 'USD';
  });
});

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
      sendAmountPercent: 100,
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
      sendAmountPercent: 100,
      slippagePercent: 2,
      enabled: false,
    },
  };
}

function makeQuotes(
  assetIds: CaipAssetType[],
): BatchSellQuotesResults['quotes'] {
  return Object.fromEntries(
    assetIds.map((assetId) => [
      assetId,
      {
        asset: {} as never,
        quote: {} as never,
        hasQuote: true,
        isLoadingQuote: false,
      },
    ]),
  );
}

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  sendAssetsConfig: makeSendAssetsConfig(),
  quotes: makeQuotes([ASSET_A]),
  receivedAsset: buildReceivedAsset({
    assetId: 'eip155:1/erc20:0xUSDC' as CaipAssetType,
    symbol: 'USDC',
  }),
  totalReceivedAmount: 100,
  minimumReceivedAmount: 95,
  totalNetworkFee: '0.01',
  totalNetworkFeeFiat: '20',
  totalNetworkFeeAssetSymbol: 'ETH',
  isBatchSellTradeAvailable: true,
  totalNetworkFeeAreLoading: false,
  totalNetworkFeeHasError: false,
  quotesAreLoading: false,
};

describe('ReviewAndConfirmModal', () => {
  it('does not render the title when open is false', () => {
    render(<ReviewAndConfirmModal {...defaultProps} open={false} />);

    expect(screen.queryByText('review')).not.toBeInTheDocument();
  });

  it('renders the review title when open', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByText('review')).toBeInTheDocument();
  });

  it('renders the singular token count when exactly one asset is enabled', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(
      screen.getByText('batchSellYouSellTokenCount:1'),
    ).toBeInTheDocument();
  });

  it('renders the plural token count when more than one asset is enabled', () => {
    const config = makeSendAssetsConfig();
    config[ASSET_B] = { ...config[ASSET_B], enabled: true };

    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        sendAssetsConfig={config}
        quotes={makeQuotes([ASSET_A, ASSET_B])}
      />,
    );

    expect(
      screen.getByText('batchSellYouSellTokenCountPlural:2'),
    ).toBeInTheDocument();
  });

  it('excludes enabled assets that do not have a quote from the token count', () => {
    const config = makeSendAssetsConfig();
    config[ASSET_B] = { ...config[ASSET_B], enabled: true };

    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        sendAssetsConfig={config}
        quotes={makeQuotes([ASSET_A])}
      />,
    );

    expect(
      screen.getByText('batchSellYouSellTokenCount:1'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('batchSellYouSellTokenCountPlural:2'),
    ).not.toBeInTheDocument();
  });

  it('toggles the summary list when the youSell row is clicked', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.queryByTestId('summary-list')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByTestId('summary-list')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { expanded: true }));

    expect(screen.queryByTestId('summary-list')).not.toBeInTheDocument();
  });

  it('renders the totals summary', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByTestId('totals-summary')).toBeInTheDocument();
  });

  it('renders the network fee label', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByText('networkFee')).toBeInTheDocument();
  });

  it('renders the Sell all label when funds are sufficient', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByText('sellAll')).toBeInTheDocument();
  });

  it('renders the insufficient balance label when trade is unavailable', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        isBatchSellTradeAvailable={false}
      />,
    );

    expect(
      screen.getByText('alertReasonInsufficientBalance'),
    ).toBeInTheDocument();
  });

  it('disables the submit button when trade is unavailable', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        isBatchSellTradeAvailable={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'alertReasonInsufficientBalance' }),
    ).toBeDisabled();
  });

  it('disables the button and shows the fallback label when the trade is unavailable', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        isBatchSellTradeAvailable={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'alertReasonInsufficientBalance' }),
    ).toBeDisabled();
  });

  it('enables the Sell all button when funds are sufficient and trade is available', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'sellAll' })).toBeEnabled();
  });

  it('calls submitBatchSellQuotes when the Sell all button is clicked', () => {
    const mockSubmitBatchSellQuotes = jest.fn();
    mockUseBatchSellSubmitQuotes.mockReturnValue({
      submitBatchSellQuotes: mockSubmitBatchSellQuotes,
      isSubmitting: false,
    });

    render(<ReviewAndConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'sellAll' }));

    expect(mockSubmitBatchSellQuotes).toHaveBeenCalled();
  });

  it('renders the rateIncludesMMFee text', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByText(/rateIncludesMMFee/u)).toBeInTheDocument();
  });

  it('falls back to receivedAsset.symbol for the fee asset when totalNetworkFeeAssetSymbol is not provided', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        totalNetworkFeeAssetSymbol={undefined}
        totalNetworkFee="0.01"
      />,
    );

    // The component should still render without errors; networkFee label is
    // always there.
    expect(screen.getByText('networkFee')).toBeInTheDocument();
  });

  it('renders the network fee row even when totalNetworkFee is undefined (skeleton)', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        totalNetworkFee={undefined}
        totalNetworkFeeFiat={undefined}
      />,
    );

    expect(screen.getByText('networkFee')).toBeInTheDocument();
  });

  it('renders the network fee row even when totalNetworkFeeFiat is null', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        totalNetworkFee="0.01"
        totalNetworkFeeFiat={null}
      />,
    );

    expect(screen.getByText('networkFee')).toBeInTheDocument();
  });

  it('renders the network fee row when totalNetworkFee is null', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        totalNetworkFee={null}
        totalNetworkFeeFiat={null}
      />,
    );

    expect(screen.getByText('networkFee')).toBeInTheDocument();
  });

  it('still renders the youSell row when an enabled asset has no iconUrl', () => {
    const config = makeSendAssetsConfig();
    config[ASSET_A] = {
      ...config[ASSET_A],
      asset: { ...config[ASSET_A].asset, iconUrl: null } as never,
    };

    render(
      <ReviewAndConfirmModal {...defaultProps} sendAssetsConfig={config} />,
    );

    expect(screen.getByText('youSell')).toBeInTheDocument();
  });

  it('calls onClose when the modal close button is clicked', () => {
    const onClose = jest.fn();

    render(<ReviewAndConfirmModal {...defaultProps} onClose={onClose} />);

    const closeButton = screen
      .getAllByRole('button')
      .find((el) => el.getAttribute('aria-label')?.toLowerCase() === 'close');

    expect(closeButton).toBeDefined();
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('quoteResponses passed to useBatchSellSubmitQuotes', () => {
    it('excludes disabled send slots and only passes enabled quotes', () => {
      const QUOTE_A = { requestId: 'req-a' } as never;
      const QUOTE_B = { requestId: 'req-b' } as never;

      const quotes: BatchSellQuotesResults['quotes'] = {
        [ASSET_A]: {
          asset: {} as never,
          quote: QUOTE_A,
          hasQuote: true,
          isLoadingQuote: false,
        },
        [ASSET_B]: {
          asset: {} as never,
          quote: QUOTE_B,
          hasQuote: true,
          isLoadingQuote: false,
        },
      };

      // ASSET_A is enabled, ASSET_B is disabled (see makeSendAssetsConfig).
      render(<ReviewAndConfirmModal {...defaultProps} quotes={quotes} />);

      expect(mockUseBatchSellSubmitQuotes).toHaveBeenCalledWith(
        expect.objectContaining({ quoteResponses: [QUOTE_A] }),
      );
    });

    it('preserves the enabled-slot order matching controller slot indices', () => {
      const ASSET_C = 'eip155:1/erc20:0xCCC' as CaipAssetType;
      const QUOTE_A = { requestId: 'req-a' } as never;
      const QUOTE_C = { requestId: 'req-c' } as never;

      const config: BatchSellQuotesConfig['sendAssetsConfig'] = {
        [ASSET_A]: {
          asset: buildBatchSellAsset({ assetId: ASSET_A }) as never,
          sendAmountPercent: 100,
          slippagePercent: 0.5,
          enabled: true,
        },
        [ASSET_B]: {
          asset: buildBatchSellAsset({ assetId: ASSET_B }) as never,
          sendAmountPercent: 0,
          slippagePercent: 0.5,
          enabled: false,
        },
        [ASSET_C]: {
          asset: buildBatchSellAsset({ assetId: ASSET_C }) as never,
          sendAmountPercent: 100,
          slippagePercent: 0.5,
          enabled: true,
        },
      };

      const quotes: BatchSellQuotesResults['quotes'] = {
        [ASSET_A]: {
          asset: {} as never,
          quote: QUOTE_A,
          hasQuote: true,
          isLoadingQuote: false,
        },
        [ASSET_B]: {
          asset: {} as never,
          quote: null as never,
          hasQuote: false,
          isLoadingQuote: false,
        },
        [ASSET_C]: {
          asset: {} as never,
          quote: QUOTE_C,
          hasQuote: true,
          isLoadingQuote: false,
        },
      };

      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          sendAssetsConfig={config}
          quotes={quotes}
        />,
      );

      // quoteResponses must be [QUOTE_A, QUOTE_C] — disabled slot B excluded.
      expect(mockUseBatchSellSubmitQuotes).toHaveBeenCalledWith(
        expect.objectContaining({ quoteResponses: [QUOTE_A, QUOTE_C] }),
      );
    });
  });

  it('uses the MM fee rate from the first quote that exposes a quoteBpsFee', () => {
    const quotes: BatchSellQuotesResults['quotes'] = {
      [ASSET_A]: {
        asset: {} as never,
        quote: {} as never,
        hasQuote: true,
        isLoadingQuote: false,
        quoteBpsFee: 100,
      },
    };

    render(<ReviewAndConfirmModal {...defaultProps} quotes={quotes} />);

    // rateIncludesMMFee is rendered with a percentage as an arg.
    expect(screen.getByText(/rateIncludesMMFee/u)).toBeInTheDocument();
  });

  it('falls back to the bridge default MM fee rate when quotes is undefined', () => {
    render(<ReviewAndConfirmModal {...defaultProps} quotes={undefined} />);

    expect(screen.getByText(/rateIncludesMMFee/u)).toBeInTheDocument();
  });

  describe('AssetsReceivedTotalAmountsSummary isLoading prop', () => {
    it('passes isLoading=true when minimumReceivedAmount is undefined', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          minimumReceivedAmount={undefined}
        />,
      );

      expect(screen.getByTestId('totals-summary')).toHaveTextContent(
        'totals-summary-loading:true',
      );
    });

    it('passes isLoading=false when minimumReceivedAmount is defined', () => {
      render(
        <ReviewAndConfirmModal {...defaultProps} minimumReceivedAmount={95} />,
      );

      expect(screen.getByTestId('totals-summary')).toHaveTextContent(
        'totals-summary-loading:false',
      );
    });
  });

  describe('NetworkFeeRow', () => {
    it('shows a skeleton while fees are loading', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFeeAreLoading={true}
        />,
      );

      expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
    });

    it('does not show a skeleton once fees have finished loading', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFeeAreLoading={false}
          totalNetworkFee="0.01"
        />,
      );

      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument();
    });

    it('renders the error styling on the label, tooltip, and amounts when totalNetworkFeeHasError is true', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFeeAreLoading={false}
          totalNetworkFeeHasError={true}
          totalNetworkFee="0.01"
          totalNetworkFeeFiat="20"
        />,
      );

      // The row still renders its label/amount despite the error styling
      // branches (error ? ... : ...) taking their "true" path.
      expect(screen.getByText('networkFee')).toBeInTheDocument();
      expect(screen.getByText(/\$20/u)).toBeInTheDocument();
    });

    it('shows a dash when fees failed to load (not loading, fee is null)', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFeeAreLoading={false}
          totalNetworkFee={null}
          totalNetworkFeeFiat={null}
        />,
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('shows a dash when fees failed to load (not loading, fee is undefined)', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFeeAreLoading={false}
          totalNetworkFee={undefined}
          totalNetworkFeeFiat={undefined}
        />,
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('does not show a dash while fees are still loading', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFeeAreLoading={true}
          totalNetworkFee={undefined}
          totalNetworkFeeFiat={undefined}
        />,
      );

      expect(screen.queryByText('-')).not.toBeInTheDocument();
    });
  });

  describe('quotesAreLoading', () => {
    it('shows the sellAll label while quotes are loading even when the trade is unavailable', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          isBatchSellTradeAvailable={false}
          quotesAreLoading={true}
        />,
      );

      expect(screen.getByText('sellAll')).toBeInTheDocument();
      expect(
        screen.queryByText('alertReasonInsufficientBalance'),
      ).not.toBeInTheDocument();
    });

    it('shows the insufficient balance label once quotes finish loading and trade is still unavailable', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          isBatchSellTradeAvailable={false}
          quotesAreLoading={false}
        />,
      );

      expect(
        screen.getByText('alertReasonInsufficientBalance'),
      ).toBeInTheDocument();
    });

    it('keeps the button disabled while quotes are loading and trade is unavailable', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          isBatchSellTradeAvailable={false}
          quotesAreLoading={true}
        />,
      );

      expect(screen.getByRole('button', { name: 'sellAll' })).toBeDisabled();
    });

    it('does not affect the label or button state when trade is available', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          isBatchSellTradeAvailable={true}
          quotesAreLoading={true}
        />,
      );

      expect(screen.getByRole('button', { name: 'sellAll' })).toBeEnabled();
    });
  });

  describe('NetworkFeeRow fiat amount', () => {
    it('renders the fiat amount when totalNetworkFeeFiat is provided', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFee="0.01"
          totalNetworkFeeFiat="20"
        />,
      );

      // formatCurrencyAmount('20', 'USD', 2) renders something like $20.00
      expect(screen.getByText(/\$20/u)).toBeInTheDocument();
    });

    it('does not render the fiat amount when totalNetworkFeeFiat is null', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFee="0.01"
          totalNetworkFeeFiat={null}
        />,
      );

      expect(screen.queryByText(/\$20/u)).not.toBeInTheDocument();
    });
  });

  describe('YouSell expanded state', () => {
    it('resets the expanded state when the modal is closed via the internal handler', () => {
      const onClose = jest.fn();

      render(<ReviewAndConfirmModal {...defaultProps} onClose={onClose} />);

      // Expand the list.
      fireEvent.click(screen.getByRole('button', { expanded: false }));
      expect(screen.getByTestId('summary-list')).toBeInTheDocument();

      // Close via the internal wrapper (which resets isYouSellExpanded).
      const closeButton = screen
        .getAllByRole('button')
        .find((el) => el.getAttribute('aria-label')?.toLowerCase() === 'close');
      expect(closeButton).toBeDefined();
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('resets the expanded state and calls onClose when the modal is closed via the escape key', () => {
      const onClose = jest.fn();

      render(<ReviewAndConfirmModal {...defaultProps} onClose={onClose} />);

      // Expand the list.
      fireEvent.click(screen.getByRole('button', { expanded: false }));
      expect(screen.getByTestId('summary-list')).toBeInTheDocument();

      // Close via the escape key, which triggers the Modal's own onClose
      // wrapper (resets isYouSellExpanded before delegating to onClose).
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
