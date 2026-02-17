///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React from 'react';
import { render, screen } from '@testing-library/react';

import { useCustomAmount } from '../../../hooks/musd/useCustomAmount';
import { useTransactionPayAvailableTokens } from '../../../hooks/pay/useTransactionPayAvailableTokens';
import { MusdOverrideContent } from './musd-override-content';

// Mock dependencies
jest.mock('../../../hooks/musd/useCustomAmount', () => ({
  useCustomAmount: jest.fn(),
}));

jest.mock('../../../hooks/pay/useTransactionPayAvailableTokens', () => ({
  useTransactionPayAvailableTokens: jest.fn(),
}));

// Mock PayWithRow component
jest.mock('../../rows/pay-with-row/pay-with-row', () => ({
  PayWithRow: () => <div data-testid="pay-with-row">PayWithRow</div>,
}));

const mockUseCustomAmount = useCustomAmount as jest.MockedFunction<
  typeof useCustomAmount
>;
const mockUseTransactionPayAvailableTokens =
  useTransactionPayAvailableTokens as jest.MockedFunction<
    typeof useTransactionPayAvailableTokens
  >;

describe('MusdOverrideContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when mUSD conversion is enabled and tokens available', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: true,
        outputAmount: '100.50',
        outputSymbol: 'mUSD',
      });
      mockUseTransactionPayAvailableTokens.mockReturnValue([
        { symbol: 'USDC', chainId: '0x1' },
      ] as ReturnType<typeof useTransactionPayAvailableTokens>);
    });

    it('should render OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.getByText('100.50 mUSD')).toBeInTheDocument();
    });

    it('should render PayWithRow', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.getByTestId('pay-with-row')).toBeInTheDocument();
    });
  });

  describe('when mUSD conversion is enabled but no tokens available', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: true,
        outputAmount: '100.50',
        outputSymbol: 'mUSD',
      });
      mockUseTransactionPayAvailableTokens.mockReturnValue([]);
    });

    it('should render OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.getByText('100.50 mUSD')).toBeInTheDocument();
    });

    it('should not render PayWithRow', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.queryByTestId('pay-with-row')).not.toBeInTheDocument();
    });
  });

  describe('when mUSD conversion is disabled', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: false,
        outputAmount: null,
        outputSymbol: null,
      });
      mockUseTransactionPayAvailableTokens.mockReturnValue([
        { symbol: 'USDC', chainId: '0x1' },
      ] as ReturnType<typeof useTransactionPayAvailableTokens>);
    });

    it('should not render OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.queryByText('100.50 mUSD')).not.toBeInTheDocument();
      expect(screen.queryByTestId('output-amount-tag')).not.toBeInTheDocument();
    });

    it('should still render PayWithRow when tokens available', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.getByTestId('pay-with-row')).toBeInTheDocument();
    });
  });

  describe('when outputAmount is null', () => {
    beforeEach(() => {
      mockUseCustomAmount.mockReturnValue({
        shouldShowOutputAmountTag: true,
        outputAmount: null,
        outputSymbol: 'mUSD',
      });
      mockUseTransactionPayAvailableTokens.mockReturnValue([
        { symbol: 'USDC', chainId: '0x1' },
      ] as ReturnType<typeof useTransactionPayAvailableTokens>);
    });

    it('should not render OutputAmountTag', () => {
      render(<MusdOverrideContent amountHuman="" />);

      expect(screen.queryByTestId('output-amount-tag')).not.toBeInTheDocument();
    });
  });
});
///: END:ONLY_INCLUDE_IF
