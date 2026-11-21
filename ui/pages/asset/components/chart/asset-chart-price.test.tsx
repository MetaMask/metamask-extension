import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import AssetChartPrice from './asset-chart-price';

// Expose the header's inputs so the test can read the percent it was given.
jest.mock('./token-price-header', () => ({
  __esModule: true,
  default: ({
    price,
    percentChange,
  }: {
    price?: number;
    percentChange?: number;
  }) => (
    <div
      data-testid="price-header"
      data-price={price}
      data-percent={percentChange}
    />
  ),
}));

type PriceHeaderRef = {
  setPrice: (payload: {
    price?: number;
    date?: number;
    hovered?: boolean;
  }) => void;
};

const renderPriceHeader = (livePercentChange1d?: number) => {
  const ref = createRef<PriceHeaderRef>();
  render(
    <AssetChartPrice
      ref={ref}
      loading={false}
      currency="usd"
      price={100}
      date={1}
      comparePrice={50}
      livePercentChange1d={livePercentChange1d}
    />,
  );
  return ref;
};

describe('AssetChartPrice', () => {
  it('shows the live 1d change at rest', () => {
    renderPriceHeader(-4);

    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-percent',
      '-4',
    );
  });

  it('shows no percent at rest when there is no 1d change', () => {
    renderPriceHeader();

    expect(screen.getByTestId('price-header')).not.toHaveAttribute(
      'data-percent',
    );
  });

  it('shows the change from the compare price while hovering', () => {
    const ref = renderPriceHeader(-4);

    act(() => {
      ref.current?.setPrice({ price: 75, date: 2, hovered: true });
    });

    // (75 - 50) / 50 * 100
    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-percent',
      '50',
    );
  });

  it('shows the live 1d change again once the pointer leaves the chart', () => {
    const ref = renderPriceHeader(-4);

    act(() => {
      ref.current?.setPrice({ price: 75, date: 2, hovered: true });
    });
    act(() => {
      ref.current?.setPrice({ price: 100, date: 3, hovered: false });
    });

    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-percent',
      '-4',
    );
  });
});
