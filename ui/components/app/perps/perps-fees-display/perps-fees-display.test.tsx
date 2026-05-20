import React from 'react';
import { render, screen } from '@testing-library/react';
import { formatPerpsFiat } from '../../../../../shared/lib/perps-formatters';
import { PerpsFeesDisplay } from './perps-fees-display';

jest.mock('../../rewards/RewardsVipBadge', () => ({
  RewardsVipBadge: () => <span data-testid="rewards-vip-badge" />,
}));

jest.mock('../../../../../shared/lib/perps-formatters', () => ({
  ...jest.requireActual('../../../../../shared/lib/perps-formatters'),
  formatPerpsFiat: jest.fn((value: number) => `$${value.toFixed(2)}`),
}));

const formatPerpsFiatMock = jest.mocked(formatPerpsFiat);

describe('PerpsFeesDisplay', () => {
  beforeEach(() => {
    formatPerpsFiatMock.mockImplementation(
      (value: string | number) => `$${Number(value).toFixed(2)}`,
    );
  });

  describe('discount visibility', () => {
    it('does not show discounted fee when metamaskFeeRateDiscountPercentage is undefined', () => {
      render(<PerpsFeesDisplay fee={10} feeTextTestId="fee" />);

      expect(screen.getByTestId('fee')).toHaveTextContent('$10.00');
      expect(screen.queryByTestId('fee-original')).not.toBeInTheDocument();
    });

    it('does not show discounted fee when metamaskFeeRateDiscountPercentage is zero', () => {
      render(
        <PerpsFeesDisplay
          fee={10}
          metamaskFeeRateDiscountPercentage={0}
          feeTextTestId="fee"
        />,
      );

      expect(screen.getByTestId('fee')).toHaveTextContent('$10.00');
      expect(screen.queryByTestId('fee-original')).not.toBeInTheDocument();
    });

    it('does not show discounted fee when metamaskFeeRateDiscountPercentage is negative', () => {
      render(
        <PerpsFeesDisplay
          fee={10}
          metamaskFeeRateDiscountPercentage={-5}
          feeTextTestId="fee"
        />,
      );

      expect(screen.getByTestId('fee')).toHaveTextContent('$10.00');
      expect(screen.queryByTestId('fee-original')).not.toBeInTheDocument();
    });

    it('shows strikethrough original and discounted fee when metamaskFeeRateDiscountPercentage is positive', () => {
      render(
        <PerpsFeesDisplay
          fee={8.5}
          metamaskFeeRateDiscountPercentage={15}
          feeTextTestId="fee"
        />,
      );

      const original = screen.getByTestId('fee-original');
      expect(original).toHaveTextContent('$10.00');
      expect(original).toHaveStyle({ textDecoration: 'line-through' });
      expect(screen.getByTestId('fee')).toHaveTextContent('$8.50');
    });

    [
      { percentage: 1, discountedFee: 9.9, expectedOriginal: '$10.00' },
      { percentage: 5, discountedFee: 9.5, expectedOriginal: '$10.00' },
      { percentage: 10, discountedFee: 9.0, expectedOriginal: '$10.00' },
      { percentage: 25, discountedFee: 7.5, expectedOriginal: '$10.00' },
      { percentage: 50, discountedFee: 5.0, expectedOriginal: '$10.00' },
    ].forEach(({ percentage, discountedFee, expectedOriginal }) => {
      it(`computes the original fee correctly for ${percentage}% discount`, () => {
        render(
          <PerpsFeesDisplay
            fee={discountedFee}
            metamaskFeeRateDiscountPercentage={percentage}
            feeTextTestId="fee"
          />,
        );

        expect(screen.getByTestId('fee-original')).toHaveTextContent(
          expectedOriginal,
        );
        expect(screen.getByTestId('fee')).toHaveTextContent(
          `$${discountedFee.toFixed(2)}`,
        );
      });
    });
  });

  describe('fee text rendering', () => {
    it('renders the formatted fee when fee is provided', () => {
      render(<PerpsFeesDisplay fee={25.5} />);

      expect(screen.getByText('$25.50')).toBeInTheDocument();
    });

    it('renders placeholder when fee is undefined', () => {
      render(<PerpsFeesDisplay fee={undefined} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('renders custom placeholder when fee is undefined', () => {
      render(<PerpsFeesDisplay fee={undefined} placeholder="--" />);

      expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders both original and discounted fee when discount is present', () => {
      render(
        <PerpsFeesDisplay fee={80} metamaskFeeRateDiscountPercentage={20} />,
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument();
    });

    it('forwards the optional feeTextTestId to the fee text node', () => {
      render(<PerpsFeesDisplay fee={0.5} feeTextTestId="my-fee-text" />);

      expect(screen.getByTestId('my-fee-text')).toHaveTextContent('$0.50');
    });
  });

  describe('VIP badge', () => {
    it('does not render the VIP badge by default', () => {
      render(<PerpsFeesDisplay fee={10} />);

      expect(
        screen.queryByTestId('rewards-vip-badge'),
      ).not.toBeInTheDocument();
    });

    it('renders the VIP badge when a discount is active', () => {
      render(
        <PerpsFeesDisplay fee={10} metamaskFeeRateDiscountPercentage={10} />,
      );

      expect(screen.getByTestId('rewards-vip-badge')).toBeInTheDocument();
    });

    it('renders VIP badge alongside discount and fee text', () => {
      render(
        <PerpsFeesDisplay
          fee={8.5}
          metamaskFeeRateDiscountPercentage={15}
        />,
      );

      expect(screen.getByTestId('rewards-vip-badge')).toBeInTheDocument();
      expect(screen.getByText('$10.00')).toBeInTheDocument();
      expect(screen.getByText('$8.50')).toBeInTheDocument();
    });
  });
});
