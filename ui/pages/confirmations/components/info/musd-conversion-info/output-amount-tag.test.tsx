///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  OutputAmountTag,
  OUTPUT_AMOUNT_TAG_SELECTOR,
} from './output-amount-tag';

describe('OutputAmountTag', () => {
  describe('rendering', () => {
    it('should render amount and symbol', () => {
      render(<OutputAmountTag amount="100.50" symbol="mUSD" />);

      expect(screen.getByText('100.50 mUSD')).toBeInTheDocument();
    });

    it('should render amount only when no symbol provided', () => {
      render(<OutputAmountTag amount="100.50" />);

      expect(screen.getByText('100.50')).toBeInTheDocument();
    });

    it('should render with default test ID', () => {
      render(<OutputAmountTag amount="100.50" symbol="mUSD" />);

      expect(
        screen.getByTestId(OUTPUT_AMOUNT_TAG_SELECTOR),
      ).toBeInTheDocument();
    });

    it('should render with custom test ID', () => {
      render(
        <OutputAmountTag
          amount="100.50"
          symbol="mUSD"
          testID="custom-test-id"
        />,
      );

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('showBackground prop', () => {
    it('should have background by default', () => {
      render(<OutputAmountTag amount="100.50" symbol="mUSD" />);

      const tag = screen.getByTestId(OUTPUT_AMOUNT_TAG_SELECTOR);
      // When showBackground is true (default), the component should have
      // the background-alternative class
      expect(tag).toHaveClass(
        'mm-box--background-color-background-alternative',
      );
    });

    it('should have background when showBackground is true', () => {
      render(
        <OutputAmountTag amount="100.50" symbol="mUSD" showBackground={true} />,
      );

      const tag = screen.getByTestId(OUTPUT_AMOUNT_TAG_SELECTOR);
      expect(tag).toHaveClass(
        'mm-box--background-color-background-alternative',
      );
    });

    it('should not have background when showBackground is false', () => {
      render(
        <OutputAmountTag
          amount="100.50"
          symbol="mUSD"
          showBackground={false}
        />,
      );

      const tag = screen.getByTestId(OUTPUT_AMOUNT_TAG_SELECTOR);
      expect(tag).not.toHaveClass(
        'mm-box--background-color-background-alternative',
      );
    });
  });

  describe('various amounts', () => {
    it('should render zero amount', () => {
      render(<OutputAmountTag amount="0.00" symbol="mUSD" />);

      expect(screen.getByText('0.00 mUSD')).toBeInTheDocument();
    });

    it('should render large amount', () => {
      render(<OutputAmountTag amount="1000000.00" symbol="mUSD" />);

      expect(screen.getByText('1000000.00 mUSD')).toBeInTheDocument();
    });

    it('should render small decimal amount', () => {
      render(<OutputAmountTag amount="0.01" symbol="mUSD" />);

      expect(screen.getByText('0.01 mUSD')).toBeInTheDocument();
    });
  });
});
///: END:ONLY_INCLUDE_IF
