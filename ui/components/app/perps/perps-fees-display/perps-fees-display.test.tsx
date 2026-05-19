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

  describe('discount badge visibility', () => {
    it('hides the discount badge when metamaskFeeRateDiscountPercentage is undefined', () => {
      render(<PerpsFeesDisplay fee={10} />);

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/u)).not.toBeInTheDocument();
    });

    it('hides the discount badge when metamaskFeeRateDiscountPercentage is zero', () => {
      render(
        <PerpsFeesDisplay fee={10} metamaskFeeRateDiscountPercentage={0} />,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
    });

    it('hides the discount badge when metamaskFeeRateDiscountPercentage is negative', () => {
      render(
        <PerpsFeesDisplay fee={10} metamaskFeeRateDiscountPercentage={-5} />,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
    });

    it('renders the discount badge when metamaskFeeRateDiscountPercentage is positive', () => {
      render(
        <PerpsFeesDisplay fee={10} metamaskFeeRateDiscountPercentage={15} />,
      );

      expect(
        screen.getByTestId('perps-fees-display-discount'),
      ).toBeInTheDocument();
      expect(screen.getByText('-15%')).toBeInTheDocument();
    });

    [1, 5, 10, 25, 50, 100].forEach((percentage) => {
      it(`renders the discount label correctly for ${percentage} percent`, () => {
        render(
          <PerpsFeesDisplay
            fee={10}
            metamaskFeeRateDiscountPercentage={percentage}
          />,
        );

        expect(screen.getByText(`-${percentage}%`)).toBeInTheDocument();
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

    it('prefixes with minus sign when negated is true', () => {
      render(<PerpsFeesDisplay fee={100} negated />);

      expect(screen.getByText('-$100.00')).toBeInTheDocument();
    });

    it('renders both fee text and discount when both are present', () => {
      render(
        <PerpsFeesDisplay fee={100} metamaskFeeRateDiscountPercentage={20} />,
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
    });

    it('strikes through the original fee when a discount is active', () => {
      render(
        <PerpsFeesDisplay
          fee={100}
          metamaskFeeRateDiscountPercentage={20}
          feeTextTestId="fee"
        />,
      );

      const original = screen.getByTestId('fee-original');
      expect(original).toHaveTextContent('$100.00');
      expect(original).toHaveStyle({ textDecoration: 'line-through' });

      const discounted = screen.getByTestId('fee');
      expect(discounted).toHaveTextContent('$80.00');
    });

    it('applies negated prefix to both original and discounted fees', () => {
      render(
        <PerpsFeesDisplay
          fee={100}
          metamaskFeeRateDiscountPercentage={50}
          negated
        />,
      );

      expect(screen.getByText('-$100.00')).toBeInTheDocument();
      expect(screen.getByText('-$50.00')).toBeInTheDocument();
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

    it('renders the VIP badge when showVipBadge is true', () => {
      render(<PerpsFeesDisplay fee={10} showVipBadge />);

      expect(screen.getByTestId('rewards-vip-badge')).toBeInTheDocument();
    });

    it('renders VIP badge alongside discount and fee text', () => {
      render(
        <PerpsFeesDisplay
          fee={10}
          metamaskFeeRateDiscountPercentage={15}
          showVipBadge
        />,
      );

      expect(screen.getByTestId('rewards-vip-badge')).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-fees-display-discount'),
      ).toBeInTheDocument();
      expect(screen.getByText('$10.00')).toBeInTheDocument();
      expect(screen.getByText('$8.50')).toBeInTheDocument();
    });
  });
});
