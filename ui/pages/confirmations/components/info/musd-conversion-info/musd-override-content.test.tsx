import React from 'react';
import { render, screen } from '@testing-library/react';

import { useCustomAmount } from '../../../../../hooks/musd/useCustomAmount';
import { useTransactionPayAvailableTokens } from '../../../hooks/pay/useTransactionPayAvailableTokens';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { MusdOverrideContent } from './musd-override-content';

jest.mock('../../../../../hooks/musd/useCustomAmount', () => ({
  useCustomAmount: jest.fn(),
}));

jest.mock('../../../hooks/pay/useTransactionPayAvailableTokens', () => ({
  useTransactionPayAvailableTokens: jest.fn(),
}));

jest.mock('../../../hooks/pay/useTransactionPayToken', () => ({
  useTransactionPayToken: jest.fn(),
}));

jest.mock('../../rows/pay-with-row/pay-with-row', () => ({
  ConfirmInfoRowSize: { Small: 'small', Default: 'default' },
  PayWithRow: () => <div data-testid="pay-with-row">PayWithRow</div>,
  PayWithRowSkeleton: () => (
    <div data-testid="pay-with-row-skeleton">PayWithRowSkeleton</div>
  ),
}));

const mockUseCustomAmount = useCustomAmount as jest.MockedFunction<
  typeof useCustomAmount
>;
const mockUseTransactionPayAvailableTokens =
  useTransactionPayAvailableTokens as jest.MockedFunction<
    typeof useTransactionPayAvailableTokens
  >;
const mockUseTransactionPayToken =
  useTransactionPayToken as jest.MockedFunction<typeof useTransactionPayToken>;

describe('MusdOverrideContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTransactionPayToken.mockReturnValue({
      payToken: { address: '0xabc', chainId: '0x1' } as unknown as ReturnType<
        typeof useTransactionPayToken
      >['payToken'],
      setPayToken: jest.fn(),
    });
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

    it('should render PayWithRowSkeleton instead of PayWithRow', () => {
      render(<MusdOverrideContent amountHuman="100.50" />);

      expect(screen.queryByTestId('pay-with-row')).not.toBeInTheDocument();
      expect(screen.getByTestId('pay-with-row-skeleton')).toBeInTheDocument();
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
