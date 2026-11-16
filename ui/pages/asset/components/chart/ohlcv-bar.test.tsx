import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { OHLCVBar, type OHLCVBarProps } from './ohlcv-bar';

// Deterministic formatters so assertions don't depend on Intl/CLDR output.
jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyTokenPrice: (price: number, currency: string) =>
      `${currency} ${price.toFixed(2)}`,
    formatNumber: (value: number, options: Intl.NumberFormatOptions = {}) => {
      if (options.style === 'percent') {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${(value * 100).toFixed(2)}%`;
      }
      return String(value);
    },
  }),
}));

const BAR = {
  time: 1700003600,
  open: 1.5,
  high: 3,
  low: 1,
  close: 2.5,
  volume: 200,
};

function renderBar(props: Partial<OHLCVBarProps> = {}) {
  const defaultProps: OHLCVBarProps = {
    data: BAR,
    currency: 'USD',
  };
  return renderWithProvider(
    <OHLCVBar {...defaultProps} {...props} />,
    configureStore({ metamask: { currentLocale: 'en' } }),
  );
}

describe('OHLCVBar', () => {
  it('renders the open/close/low/high labels and formatted values', () => {
    renderBar({ 'data-testid': 'ohlcv-bar' });

    expect(screen.getByTestId('ohlcv-bar')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();

    expect(screen.getByText('USD 1.50')).toBeInTheDocument(); // open
    expect(screen.getByText('USD 2.50')).toBeInTheDocument(); // close
    expect(screen.getByText('USD 1.00')).toBeInTheDocument(); // low
    expect(screen.getByText('USD 3.00')).toBeInTheDocument(); // high
  });

  it('shows the volume row when volume is present', () => {
    renderBar();

    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('shows a dash for zero volume', () => {
    renderBar({ data: { ...BAR, volume: 0 } });

    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  it('omits the volume row when volume is undefined', () => {
    renderBar({ data: { ...BAR, volume: undefined } });

    expect(screen.queryByText('Volume')).not.toBeInTheDocument();
  });

  it('omits the change row when no change percent is given', () => {
    renderBar();

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('renders a positive change in green', () => {
    renderBar({ changePercent: 5.25 });

    const change = screen.getByText('+5.25%');
    expect(change).toBeInTheDocument();
    expect(change).toHaveClass('text-success-default');
  });

  it('renders a negative change in red', () => {
    renderBar({ changePercent: -3.75 });

    const change = screen.getByText('-3.75%');
    expect(change).toBeInTheDocument();
    expect(change).toHaveClass('text-error-default');
  });

  it('renders a zero change in the default color', () => {
    renderBar({ changePercent: 0 });

    const change = screen.getByText('+0.00%');
    expect(change).toBeInTheDocument();
    expect(change).toHaveClass('text-default');
  });

  it('ignores a NaN change percent', () => {
    renderBar({ changePercent: Number.NaN });

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });
});
