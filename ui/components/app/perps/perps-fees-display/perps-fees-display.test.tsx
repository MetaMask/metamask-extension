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
          fee={10}
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
      { percentage: 1, expected: '$9.90' },
      { percentage: 5, expected: '$9.50' },
      { percentage: 10, expected: '$9.00' },
      { percentage: 25, expected: '$7.50' },
      { percentage: 50, expected: '$5.00' },
      { percentage: 100, expected: '$0.00' },
    ].forEach(({ percentage, expected }) => {
      it(`computes the discounted fee correctly for ${percentage}%`, () => {
        render(
          <PerpsFeesDisplay
            fee={10}
            metamaskFeeRateDiscountPercentage={percentage}
            feeTextTestId="fee"
          />,
        );

        expect(screen.getByTestId('fee')).toHaveTextContent(expected);
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

    it('renders both original and discounted fee when discount is present', () => {
      render(
        <PerpsFeesDisplay fee={100} metamaskFeeRateDiscountPercentage={20} />,
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument();
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
      expect(screen.getByText('$10.00')).toBeInTheDocument();
      expect(screen.getByText('$8.50')).toBeInTheDocument();
    });
  });
});
