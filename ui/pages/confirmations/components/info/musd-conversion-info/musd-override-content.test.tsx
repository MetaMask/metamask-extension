import React from 'react';
import { render, screen } from '@testing-library/react';

import { useCustomAmount } from '../../../../../hooks/musd/useCustomAmount';
import { MusdOverrideContent } from './musd-override-content';

jest.mock('../../../../../hooks/musd/useCustomAmount', () => ({
  useCustomAmount: jest.fn(),
}));

const mockUseCustomAmount = useCustomAmount as jest.MockedFunction<
  typeof useCustomAmount
>;

describe('MusdOverrideContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when mUSD conversion is enabled and output is available', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: true,
        outputAmount: '100.50',
        outputSymbol: 'mUSD',
      });
    });

    it('renders OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.getByText('100.50 mUSD')).toBeInTheDocument();
    });
  });

  describe('when mUSD conversion is disabled', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: false,
        outputAmount: null,
        outputSymbol: null,
      });
    });

    it('does not render OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.queryByText('100.50 mUSD')).not.toBeInTheDocument();
      expect(screen.queryByTestId('output-amount-tag')).not.toBeInTheDocument();
    });
  });

  describe('when outputAmount is null', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: true,
        outputAmount: null,
        outputSymbol: 'mUSD',
      });
    });

    it('does not render OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="" />);

      expect(screen.queryByTestId('output-amount-tag')).not.toBeInTheDocument();
    });
  });
});
