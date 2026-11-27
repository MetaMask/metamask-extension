import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import AssetChartPrice from './asset-chart-price';

// Expose the header's inputs so the test can read the percent it was given.
jest.mock('./token-price-header', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

const buildPriceHeader = (ref: React.Ref<PriceHeaderRef>, price: number) => (
  <AssetChartPrice
    ref={ref}
    loading={false}
    currency="usd"
    price={price}
    date={1}
    comparePrice={50}
  />
);

const renderPriceHeader = () => {
  const ref = createRef<PriceHeaderRef>();
  const { rerender } = render(buildPriceHeader(ref, 100));
  return {
    ref,
    rerender: (price: number) => rerender(buildPriceHeader(ref, price)),
  };
};

describe('AssetChartPrice', () => {
  it('shows the change from the compare price at rest', () => {
    renderPriceHeader();

    // (100 - 50) / 50 * 100
    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-percent',
      '100',
    );
  });

  it('shows the change from the compare price while hovering', () => {
    const { ref } = renderPriceHeader();

    act(() => {
      ref.current?.setPrice({ price: 75, date: 2, hovered: true });
    });

    // (75 - 50) / 50 * 100
    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-percent',
      '50',
    );
  });

  it('shows the range change again once the pointer leaves the chart', () => {
    const { ref } = renderPriceHeader();

    act(() => {
      ref.current?.setPrice({ price: 75, date: 2, hovered: true });
    });
    act(() => {
      ref.current?.setPrice({ price: 100, date: 3, hovered: false });
    });

    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-percent',
      '100',
    );
  });

  it('follows the streamed price at rest', () => {
    const { rerender } = renderPriceHeader();

    rerender(120);

    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-price',
      '120',
    );
  });

  it('keeps the hovered point when a price tick arrives', () => {
    const { ref, rerender } = renderPriceHeader();

    act(() => {
      ref.current?.setPrice({ price: 75, date: 2, hovered: true });
    });
    rerender(120);

    const header = screen.getByTestId('price-header');
    expect(header).toHaveAttribute('data-price', '75');
    expect(header).toHaveAttribute('data-percent', '50');
  });

  it('shows the latest streamed price once the pointer leaves the chart', () => {
    const { ref, rerender } = renderPriceHeader();

    act(() => {
      ref.current?.setPrice({ price: 75, date: 2, hovered: true });
    });
    rerender(120);
    act(() => {
      ref.current?.setPrice({ hovered: false });
    });

    expect(screen.getByTestId('price-header')).toHaveAttribute(
      'data-price',
      '120',
    );
  });
});
