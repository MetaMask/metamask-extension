import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  BATCH_SELL_ASSET_IDS,
  buildSendAssetConfigEntry,
  buildReceivedAsset,
} from '../../../../../test/data/batch-sell';
import { useBatchSellQuotesConfig } from './hooks/useBatchSellQuotesConfig';
import { useBatchSellQuotesFetching } from './hooks/useBatchSellQuotesFetching';
import { useBatchSellAggregateValidation } from './hooks/useBatchSellAggregateValidation';
import { BatchSellReviewPage } from './batch-sell-review-page';

// ── Hooks ──────────────────────────────────────────────────────────────────
jest.mock('./hooks/useBatchSellQuotesConfig');
jest.mock('./hooks/useBatchSellQuotesFetching');
jest.mock('./hooks/useBatchSellTradesFetching', () => ({
  useBatchSellTradesFetching: jest.fn(),
}));
jest.mock('./hooks/useBatchSellAggregateValidation');

// ── Utilities ──────────────────────────────────────────────────────────────
jest.mock('./utils/hasAtLeastOneQuoteAvailable', () => ({
  hasAtLeastOneQuoteAvailable: jest.fn(() => false),
}));
jest.mock('./utils/hasAnyEnabledAsset', () => ({
  hasAnyEnabledAsset: jest.fn(() => false),
}));

// ── Redux ──────────────────────────────────────────────────────────────────
jest.mock('../../../../ducks/batch-sell/selectors', () => ({
  getBatchSellTrades: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

// ── Router ─────────────────────────────────────────────────────────────────
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
}));

// ── Sub-components ─────────────────────────────────────────────────────────
// Thin stubs that expose only the callbacks and data attributes needed by
// the tests; everything else is either dropped or rendered as null.
jest.mock('./components/header', () => ({
  Header: ({
    onSelectReceivedAssetClick,
    onTotalReceivedFiatIconClick,
  }: {
    onSelectReceivedAssetClick: () => void;
    onTotalReceivedFiatIconClick: () => void;
  }) => (
    <>
      <button
        data-testid="header-select-asset"
        onClick={onSelectReceivedAssetClick}
      />
      <button
        data-testid="header-total-received"
        onClick={onTotalReceivedFiatIconClick}
      />
    </>
  ),
}));

jest.mock('./components/quotes-list', () => ({
  QuotesList: () => null,
}));

jest.mock('./components/footer', () => ({
  Footer: ({
    onReviewClick,
    reviewIsDisabled,
    areQuotesRefreshExpired,
    onGetNewQuotesClick,
  }: {
    onReviewClick: () => void;
    reviewIsDisabled: boolean;
    areQuotesRefreshExpired: boolean;
    onGetNewQuotesClick: () => void;
  }) => (
    <div>
      <button
        data-testid="footer-review"
        data-disabled={String(reviewIsDisabled)}
        onClick={onReviewClick}
      />
      <span
        data-testid="footer-expired"
        data-value={String(areQuotesRefreshExpired)}
      />
      <button data-testid="footer-new-quotes" onClick={onGetNewQuotesClick} />
    </div>
  ),
}));

jest.mock('./components/select-received-asset-modal', () => ({
  SelectReceivedAssetModal: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="select-received-asset-modal">
        <button data-testid="select-received-asset-close" onClick={onClose} />
      </div>
    ) : null,
}));

jest.mock('./components/total-received-modal', () => ({
  TotalReceivedModal: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="total-received-modal">
        <button data-testid="total-received-close" onClick={onClose} />
      </div>
    ) : null,
}));

jest.mock('./components/slippage-modal', () => ({
  SlippageModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="slippage-modal">
      <button data-testid="slippage-close" onClick={onClose} />
    </div>
  ),
}));

jest.mock('./components/review-and-confirm-modal', () => ({
  ReviewAndConfirmModal: ({
    open,
    onClose,
    totalNetworkFeeAreLoading,
  }: {
    open: boolean;
    onClose: () => void;
    totalNetworkFeeAreLoading: boolean;
  }) =>
    open ? (
      <div
        data-testid="review-confirm-modal"
        data-fees-loading={String(totalNetworkFeeAreLoading)}
      >
        <button data-testid="review-confirm-close" onClick={onClose} />
      </div>
    ) : null,
}));

// ── Typed mocks ────────────────────────────────────────────────────────────
const mockUseBatchSellQuotesConfig = jest.mocked(useBatchSellQuotesConfig);
const mockUseBatchSellQuotesFetching = jest.mocked(useBatchSellQuotesFetching);
const mockUseBatchSellAggregateValidation = jest.mocked(
  useBatchSellAggregateValidation,
);
const mockUseSelector = jest.mocked(useSelector);

// ── Default return values ──────────────────────────────────────────────────
const defaultQuotesConfig = {
  sendAssetsConfig: {
    [BATCH_SELL_ASSET_IDS.DAI]: buildSendAssetConfigEntry(true),
  },
  selectedReceiveAsset: buildReceivedAsset({
    assetId: BATCH_SELL_ASSET_IDS.USDC,
    symbol: 'USDC',
  }),
  editingSlippageAssetId: null,
  canDeleteAssets: false,
  receivedAssets: [],
  hasInitialSelection: true,
  setSendAmountPercent: jest.fn(),
  setEnabled: jest.fn(),
  setSlippagePercent: jest.fn(),
  setEditingSlippageAssetId: jest.fn(),
  selectReceivedAsset: jest.fn(),
  deleteAsset: jest.fn(),
} satisfies Partial<ReturnType<typeof useBatchSellQuotesConfig>>;

const defaultQuotesFetching = {
  data: undefined,
  entries: [],
  isLoading: false,
  quotesLastFetchedMs: null,
  areQuotesRefreshExpired: false,
  refetch: jest.fn(),
} satisfies Partial<ReturnType<typeof useBatchSellQuotesFetching>>;

const defaultValidation = {
  isNoQuotesAvailable: false,
  nativeAssetSymbol: 'ETH',
} satisfies Partial<ReturnType<typeof useBatchSellAggregateValidation>>;

const defaultBatchSellTrades = {
  totalNetworkFee: undefined,
  isBatchSellTradeAvailable: false,
  isLoading: false,
};

// ── renderPage helper ──────────────────────────────────────────────────────
type RenderPageOptions = {
  quotesConfig?: Partial<ReturnType<typeof useBatchSellQuotesConfig>>;
  quotesFetching?: Partial<ReturnType<typeof useBatchSellQuotesFetching>>;
  validation?: Partial<ReturnType<typeof useBatchSellAggregateValidation>>;
  trades?: Partial<typeof defaultBatchSellTrades>;
};

function renderPage(overrides: RenderPageOptions = {}) {
  mockUseBatchSellQuotesConfig.mockReturnValue({
    ...defaultQuotesConfig,
    ...overrides.quotesConfig,
  } as never);
  mockUseBatchSellQuotesFetching.mockReturnValue({
    ...defaultQuotesFetching,
    ...overrides.quotesFetching,
  } as never);
  mockUseBatchSellAggregateValidation.mockReturnValue({
    ...defaultValidation,
    ...overrides.validation,
  });
  mockUseSelector.mockReturnValue({
    ...defaultBatchSellTrades,
    ...overrides.trades,
  });
  return render(<BatchSellReviewPage />);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('BatchSellReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('navigation guard', () => {
    it('redirects to the select page when hasInitialSelection is false', () => {
      renderPage({ quotesConfig: { hasInitialSelection: false } });

      const nav = screen.getByTestId('navigate');
      expect(nav).toBeInTheDocument();
      expect(nav.getAttribute('data-to')).toBe('/batch-sell/select');
    });

    it('renders the review page when hasInitialSelection is true', () => {
      renderPage();

      expect(screen.getByTestId('batch-sell-review-page')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('reviewIsDisabled', () => {
    it('is true when quotes are loading', () => {
      renderPage({ quotesFetching: { isLoading: true } });

      expect(
        screen.getByTestId('footer-review').getAttribute('data-disabled'),
      ).toBe('true');
    });

    it('is true when data is undefined', () => {
      renderPage({ quotesFetching: { data: undefined, isLoading: false } });

      expect(
        screen.getByTestId('footer-review').getAttribute('data-disabled'),
      ).toBe('true');
    });

    it('is true when isNoQuotesAvailable is true', () => {
      renderPage({
        quotesFetching: { data: { quotes: {} } as never, isLoading: false },
        validation: { isNoQuotesAvailable: true },
      });

      expect(
        screen.getByTestId('footer-review').getAttribute('data-disabled'),
      ).toBe('true');
    });

    it('is false when data exists, quotes are not loading, and quotes are available', () => {
      renderPage({
        quotesFetching: { data: { quotes: {} } as never, isLoading: false },
      });

      expect(
        screen.getByTestId('footer-review').getAttribute('data-disabled'),
      ).toBe('false');
    });
  });

  describe('SelectReceivedAssetModal', () => {
    it('is closed by default', () => {
      renderPage();

      expect(
        screen.queryByTestId('select-received-asset-modal'),
      ).not.toBeInTheDocument();
    });

    it('opens when the header select-asset button is clicked', () => {
      renderPage();

      fireEvent.click(screen.getByTestId('header-select-asset'));

      expect(
        screen.getByTestId('select-received-asset-modal'),
      ).toBeInTheDocument();
    });

    it('closes when its onClose callback fires', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('header-select-asset'));
      fireEvent.click(screen.getByTestId('select-received-asset-close'));

      expect(
        screen.queryByTestId('select-received-asset-modal'),
      ).not.toBeInTheDocument();
    });
  });

  describe('TotalReceivedModal', () => {
    it('is closed by default', () => {
      renderPage();

      expect(
        screen.queryByTestId('total-received-modal'),
      ).not.toBeInTheDocument();
    });

    it('opens when the header total-received icon is clicked', () => {
      renderPage();

      fireEvent.click(screen.getByTestId('header-total-received'));

      expect(screen.getByTestId('total-received-modal')).toBeInTheDocument();
    });

    it('closes when its onClose callback fires', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('header-total-received'));
      fireEvent.click(screen.getByTestId('total-received-close'));

      expect(
        screen.queryByTestId('total-received-modal'),
      ).not.toBeInTheDocument();
    });
  });

  describe('ReviewAndConfirmModal', () => {
    it('is closed by default', () => {
      renderPage();

      expect(
        screen.queryByTestId('review-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    it('opens when the footer review button is clicked', () => {
      renderPage();

      fireEvent.click(screen.getByTestId('footer-review'));

      expect(screen.getByTestId('review-confirm-modal')).toBeInTheDocument();
    });

    it('closes when its onClose callback fires', () => {
      renderPage();
      fireEvent.click(screen.getByTestId('footer-review'));
      fireEvent.click(screen.getByTestId('review-confirm-close'));

      expect(
        screen.queryByTestId('review-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    it('closes automatically when areQuotesRefreshExpired changes to true', () => {
      const { rerender } = renderPage();

      fireEvent.click(screen.getByTestId('footer-review'));
      expect(screen.getByTestId('review-confirm-modal')).toBeInTheDocument();

      mockUseBatchSellQuotesFetching.mockReturnValue({
        ...defaultQuotesFetching,
        areQuotesRefreshExpired: true,
      } as never);
      rerender(<BatchSellReviewPage />);

      expect(
        screen.queryByTestId('review-confirm-modal'),
      ).not.toBeInTheDocument();
    });

    describe('totalNetworkFeeAreLoading', () => {
      it('passes false when network fee is not loading', () => {
        renderPage({ trades: { isLoading: false } });

        fireEvent.click(screen.getByTestId('footer-review'));

        expect(
          screen
            .getByTestId('review-confirm-modal')
            .getAttribute('data-fees-loading'),
        ).toBe('false');
      });

      it('passes true when network fee is loading', () => {
        renderPage({ trades: { isLoading: true } });

        fireEvent.click(screen.getByTestId('footer-review'));

        expect(
          screen
            .getByTestId('review-confirm-modal')
            .getAttribute('data-fees-loading'),
        ).toBe('true');
      });
    });
  });

  describe('SlippageModal', () => {
    it('is not rendered when editingSlippageAssetId is null', () => {
      renderPage();

      expect(screen.queryByTestId('slippage-modal')).not.toBeInTheDocument();
    });

    it('is rendered when editingSlippageAssetId is set to an asset id', () => {
      renderPage({
        quotesConfig: { editingSlippageAssetId: BATCH_SELL_ASSET_IDS.DAI },
      });

      expect(screen.getByTestId('slippage-modal')).toBeInTheDocument();
    });

    it('calls setEditingSlippageAssetId(null) when the modal is closed', () => {
      const mockSetEditingSlippageAssetId = jest.fn();
      renderPage({
        quotesConfig: {
          editingSlippageAssetId: BATCH_SELL_ASSET_IDS.DAI,
          setEditingSlippageAssetId: mockSetEditingSlippageAssetId,
        },
      });

      fireEvent.click(screen.getByTestId('slippage-close'));

      expect(mockSetEditingSlippageAssetId).toHaveBeenCalledWith(null);
    });
  });
});
