import React from 'react';
import { render, screen } from '@testing-library/react';
import { PerpsFeesDisplay } from './perps-fees-display';

describe('PerpsFeesDisplay', () => {
  describe('discount badge visibility', () => {
    it('hides the discount badge when metamaskFeeRateDiscountPercentage is undefined', () => {
      render(<PerpsFeesDisplay formatFeeText="$10.00" />);

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/u)).not.toBeInTheDocument();
    });

    it('hides the discount badge when metamaskFeeRateDiscountPercentage is zero', () => {
      render(
        <PerpsFeesDisplay
          formatFeeText="$10.00"
          metamaskFeeRateDiscountPercentage={0}
        />,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
    });

    it('hides the discount badge when metamaskFeeRateDiscountPercentage is negative', () => {
      render(
        <PerpsFeesDisplay
          formatFeeText="$10.00"
          metamaskFeeRateDiscountPercentage={-5}
        />,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
    });

    it('renders the discount badge when metamaskFeeRateDiscountPercentage is positive', () => {
      render(
        <PerpsFeesDisplay
          formatFeeText="$10.00"
          metamaskFeeRateDiscountPercentage={15}
        />,
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
            formatFeeText="$10.00"
            metamaskFeeRateDiscountPercentage={percentage}
          />,
        );

        expect(screen.getByText(`-${percentage}%`)).toBeInTheDocument();
      });
    });
  });

  describe('fee text rendering', () => {
    it('always renders the formatted fee text', () => {
      render(<PerpsFeesDisplay formatFeeText="$25.50" />);

      expect(screen.getByText('$25.50')).toBeInTheDocument();
    });

    it('renders both fee text and discount when both are present', () => {
      render(
        <PerpsFeesDisplay
          formatFeeText="$100.00"
          metamaskFeeRateDiscountPercentage={20}
        />,
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
    });

    it('forwards the optional feeTextTestId to the fee text node', () => {
      render(
        <PerpsFeesDisplay formatFeeText="$0.50" feeTextTestId="my-fee-text" />,
      );

      expect(screen.getByTestId('my-fee-text')).toHaveTextContent('$0.50');
    });
  });
});
