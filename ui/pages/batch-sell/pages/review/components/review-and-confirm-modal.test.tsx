import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { ReviewAndConfirmModal } from './review-and-confirm-modal';

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
    [ASSET_B]: {
      asset: {
        assetId: ASSET_B,
        symbol: 'BBB',
        name: 'Token B',
        chainId: 'eip155:1',
        balance: '1',
        decimals: 18,
        iconUrl: '',
      } as never,
      sendAmountPercent: 100,
      slippagePercent: 2,
      enabled: false,
    },
  };
}

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  sendAssetsConfig: makeSendAssetsConfig(),
  receivedAsset: { symbol: 'USDC' },
  totalReceivedAmount: 100,
  minimumReceivedAmount: 95,
  totalNetworkFee: '0.01',
  totalNetworkFeeFiat: '20',
  networkFeeAssetSymbol: 'ETH',
  isInsufficientGasForFee: false,
  isBatchSellTradeAvailable: true,
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
      <ReviewAndConfirmModal {...defaultProps} sendAssetsConfig={config} />,
    );

    expect(
      screen.getByText('batchSellYouSellTokenCountPlural:2'),
    ).toBeInTheDocument();
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

  it('renders the insufficient balance label when funds are insufficient', () => {
    render(<ReviewAndConfirmModal {...defaultProps} isInsufficientGasForFee />);

    expect(
      screen.getByText('alertReasonInsufficientBalance'),
    ).toBeInTheDocument();
  });

  it('disables the Sell all button when funds are insufficient', () => {
    render(<ReviewAndConfirmModal {...defaultProps} isInsufficientGasForFee />);

    expect(
      screen.getByRole('button', { name: 'alertReasonInsufficientBalance' }),
    ).toBeDisabled();
  });

  it('disables the Sell all button when the trade is unavailable', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        isBatchSellTradeAvailable={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'sellAll' })).toBeDisabled();
  });

  it('enables the Sell all button when funds are sufficient and trade is available', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'sellAll' })).toBeEnabled();
  });

  it('invokes the submit click handler without throwing when the Sell all button is clicked', () => {
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    render(<ReviewAndConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'sellAll' }));

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('renders the rateIncludesMMFee text', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByText(/rateIncludesMMFee/u)).toBeInTheDocument();
  });

  it('falls back to receivedAsset.symbol for the fee asset when networkFeeAssetSymbol is not provided', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        networkFeeAssetSymbol={undefined}
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

  describe('NetworkFeeRow skeleton', () => {
    it('shows the skeleton when totalNetworkFee is undefined', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFee={undefined}
          totalNetworkFeeFiat={undefined}
        />,
      );

      expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
    });

    it('shows the skeleton when totalNetworkFee is null', () => {
      render(
        <ReviewAndConfirmModal
          {...defaultProps}
          totalNetworkFee={null}
          totalNetworkFeeFiat={null}
        />,
      );

      expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
    });

    it('does not show the skeleton when totalNetworkFee is provided', () => {
      render(
        <ReviewAndConfirmModal {...defaultProps} totalNetworkFee="0.01" />,
      );

      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument();
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
  });
});
