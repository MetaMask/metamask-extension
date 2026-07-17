import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesResults } from '../types';
import {
  buildBatchSellAsset,
  seedCurrencyLocaleSelectors,
} from '../../../../../../test/data/batch-sell';
import { QuotesListItem } from './quotes-list-item';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: (state: { currency?: string }) => state?.currency,
}));

jest.mock('../../../../../ducks/locale/locale', () => ({
  getIntlLocale: (state: { locale?: string }) => state?.locale,
}));

jest.mock('../../../../../components/app/perps/perps-slider', () => ({
  PerpsSlider: ({
    onChange,
    value,
  }: {
    value: number;
    onChange: (e: unknown, v: number | number[]) => void;
  }) => (
    <>
      <input
        type="range"
        aria-label="perps-slider"
        value={value}
        onChange={(e) => onChange(e, Number(e.target.value))}
        readOnly
      />
      <button
        type="button"
        aria-label="perps-slider-array"
        onClick={() => onChange(null, [42, 99])}
      >
        slider-array
      </button>
    </>
  ),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

const ASSET_ID = 'eip155:1/erc20:0xAAA' as CaipAssetType;

const makeAsset = (overrides = {}) =>
  buildBatchSellAsset({
    assetId: ASSET_ID,
    symbol: 'AAA',
    name: 'Token A',
    balance: '10',
    ...overrides,
  });

const makeQuote = (
  overrides: Partial<BatchSellQuotesResults['quotes'][CaipAssetType]> = {},
): BatchSellQuotesResults['quotes'][CaipAssetType] => ({
  asset: makeAsset(),
  quote: {} as never,
  hasQuote: true,
  isLoadingQuote: false,
  receivedAmountFiat: 100,
  ...overrides,
});

const defaultProps = {
  asset: makeAsset(),
  sendAmountPercent: 50,
  onSendAmountPercentChange: jest.fn(),
  onSlippagePercentChangeClick: jest.fn(),
  onAssetDeleteClick: jest.fn(),
  canDeleteAssets: true,
  quote: makeQuote(),
  enabled: true,
};

describe('QuotesListItem', () => {
  beforeEach(() => {
    seedCurrencyLocaleSelectors(mockUseSelector);
  });

  it('renders the formatted fiat amount when quote is available', () => {
    render(<QuotesListItem {...defaultProps} />);

    expect(screen.getByText(/100/u)).toBeInTheDocument();
  });

  it('renders the skeleton placeholder fiat amount when quote is undefined and asset is enabled', () => {
    render(<QuotesListItem {...defaultProps} quote={undefined} />);

    // The hardcoded placeholder $1,234.34 is rendered behind the skeleton.
    expect(screen.getByText(/1,234/u)).toBeInTheDocument();
  });

  it('renders the skeleton placeholder fiat amount when the quote is still loading for this slot', () => {
    render(
      <QuotesListItem
        {...defaultProps}
        quote={{
          asset: makeAsset(),
          quote: null as never,
          hasQuote: false,
          isLoadingQuote: true,
        }}
      />,
    );

    expect(screen.getByText(/1,234/u)).toBeInTheDocument();
  });

  it('handles assets with no balance by treating it as 0', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(
      <QuotesListItem
        {...defaultProps}
        asset={makeAsset({ balance: undefined as never, symbol: 'AAA' })}
        sendAmountPercent={50}
      />,
    );

    // 0 * 50/100 = 0 → "0 AAA"
    expect(screen.getByText(/0.*•.*50%/u)).toBeInTheDocument();
  });

  it('renders the noQuoteAvailable text when quote is settled but has no quote', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(
      <QuotesListItem
        {...defaultProps}
        quote={makeQuote({ hasQuote: false })}
      />,
    );

    expect(screen.getByText('noQuoteAvailable')).toBeInTheDocument();
  });

  it('renders the noQuoteAvailable text when the asset is disabled', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(<QuotesListItem {...defaultProps} enabled={false} />);

    expect(screen.getByText('noQuoteAvailable')).toBeInTheDocument();
  });

  it('renders the high price impact warning tag when flagged', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(
      <QuotesListItem
        {...defaultProps}
        quote={makeQuote({ hasHighPriceImpactWarning: true })}
      />,
    );

    expect(screen.getByText('bridgePriceImpactHigh')).toBeInTheDocument();
  });

  it('does not render the high price impact warning when not flagged', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(<QuotesListItem {...defaultProps} />);

    expect(screen.queryByText('bridgePriceImpactHigh')).not.toBeInTheDocument();
  });

  it('renders the selected native amount with send percent', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(
      <QuotesListItem
        {...defaultProps}
        asset={makeAsset({ balance: '10', symbol: 'AAA' })}
        sendAmountPercent={25}
      />,
    );

    // 10 * 25/100 = 2.5
    expect(screen.getByText(/2\.5.*•.*25%/u)).toBeInTheDocument();
  });

  it('does not throw when sendAmountPercent has more than 15 significant digits', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);

    expect(() =>
      render(
        <QuotesListItem
          {...defaultProps}
          asset={makeAsset({ balance: '10', symbol: 'AAA' })}
          sendAmountPercent={33.333333333333336}
        />,
      ),
    ).not.toThrow();
  });

  it('calls onSlippagePercentChangeClick with the asset when the slippage button is clicked', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    const onSlippagePercentChangeClick = jest.fn();
    const asset = makeAsset();

    render(
      <QuotesListItem
        {...defaultProps}
        asset={asset}
        onSlippagePercentChangeClick={onSlippagePercentChangeClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'swapAdjustSlippage' }));

    expect(onSlippagePercentChangeClick).toHaveBeenCalledWith(asset);
  });

  it('calls onAssetDeleteClick with the asset when the delete button is clicked', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    const onAssetDeleteClick = jest.fn();
    const asset = makeAsset();

    render(
      <QuotesListItem
        {...defaultProps}
        asset={asset}
        onAssetDeleteClick={onAssetDeleteClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(onAssetDeleteClick).toHaveBeenCalledWith(asset);
  });

  it('disables the delete button when canDeleteAssets is false', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    render(<QuotesListItem {...defaultProps} canDeleteAssets={false} />);

    expect(screen.getByRole('button', { name: 'delete' })).toBeDisabled();
  });

  it('forwards slider changes to onSendAmountPercentChange with the asset', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    const onSendAmountPercentChange = jest.fn();
    const asset = makeAsset();

    render(
      <QuotesListItem
        {...defaultProps}
        asset={asset}
        onSendAmountPercentChange={onSendAmountPercentChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('perps-slider'), {
      target: { value: '75' },
    });

    expect(onSendAmountPercentChange).toHaveBeenCalledWith(asset, 75);
  });

  it('handles array value from slider by picking the first element', () => {
    seedCurrencyLocaleSelectors(mockUseSelector);
    const onSendAmountPercentChange = jest.fn();
    const asset = makeAsset();

    render(
      <QuotesListItem
        {...defaultProps}
        asset={asset}
        onSendAmountPercentChange={onSendAmountPercentChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('perps-slider-array'));

    expect(onSendAmountPercentChange).toHaveBeenCalledWith(asset, 42);
  });
});
