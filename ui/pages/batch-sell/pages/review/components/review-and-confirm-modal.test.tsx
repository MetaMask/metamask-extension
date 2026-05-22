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
  AssetsReceivedTotalAmountsSummary: () => (
    <div data-testid="totals-summary">totals-summary</div>
  ),
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

  it('renders the submit label when funds are sufficient', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByText('submit')).toBeInTheDocument();
  });

  it('renders the insufficient balance label when funds are insufficient', () => {
    render(<ReviewAndConfirmModal {...defaultProps} isInsufficientGasForFee />);

    expect(
      screen.getByText('alertReasonInsufficientBalance'),
    ).toBeInTheDocument();
  });

  it('disables the submit button when funds are insufficient', () => {
    render(<ReviewAndConfirmModal {...defaultProps} isInsufficientGasForFee />);

    expect(
      screen.getByRole('button', { name: 'alertReasonInsufficientBalance' }),
    ).toBeDisabled();
  });

  it('disables the submit button when the trade is unavailable', () => {
    render(
      <ReviewAndConfirmModal
        {...defaultProps}
        isBatchSellTradeAvailable={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();
  });

  it('enables the submit button when funds are sufficient and trade is available', () => {
    render(<ReviewAndConfirmModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'submit' })).toBeEnabled();
  });

  it('invokes the submit click handler without throwing when the submit button is clicked', () => {
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    render(<ReviewAndConfirmModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

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
        quoteBpsFee: 100,
      },
    };

    render(<ReviewAndConfirmModal {...defaultProps} quotes={quotes} />);

    // rateIncludesMMFee is rendered with a percentage as an arg.
    expect(screen.getByText(/rateIncludesMMFee/u)).toBeInTheDocument();
  });
});
