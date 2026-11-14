import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartTooltip from './chart-tooltip';

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyTokenPrice: (price: number, currency: string) =>
      `${currency} ${price.toFixed(2)}`,
  }),
}));

describe('ChartTooltip', () => {
  it('displays the price in the requested currency', () => {
    render(<ChartTooltip point={{ x: 150, y: 12.5 }} currency="EUR" />);

    expect(screen.getByText('EUR 12.50')).toBeInTheDocument();
  });

  it('displays a zero price', () => {
    render(<ChartTooltip point={{ x: 150, y: 0 }} currency="USD" />);

    expect(screen.getByText('USD 0.00')).toBeInTheDocument();
  });

  it('preserves a blank label when the price is unavailable', () => {
    const { container } = render(<ChartTooltip currency="USD" />);

    expect(container.textContent).toBe('\u00A0');
  });

  it('updates the label position when the point moves across the chart', () => {
    const { rerender } = render(
      <ChartTooltip
        point={{ x: 125, y: 12.5 }}
        xMin={100}
        xMax={200}
        currency="USD"
      />,
    );

    expect(screen.getByText('USD 12.50').parentElement).toHaveStyle({
      direction: 'ltr',
      paddingRight: '50%',
    });

    rerender(
      <ChartTooltip
        point={{ x: 175, y: 15 }}
        xMin={100}
        xMax={200}
        currency="USD"
      />,
    );

    expect(screen.getByText('USD 15.00').parentElement).toHaveStyle({
      direction: 'rtl',
      paddingLeft: '50%',
    });
    expect(screen.queryByText('USD 12.50')).not.toBeInTheDocument();
  });
});
