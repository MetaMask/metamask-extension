/**
 * AccountCountDisplay Component Tests
 * Feature: account-count-display
 * User Story 1 (P1): View Total Account Count
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountCountDisplay } from '.';

// Mock the useAccountCount hook
jest.mock('../../../hooks/useAccountCount', () => ({
  useAccountCount: jest.fn(),
}));

import { useAccountCount } from '../../../hooks/useAccountCount';

const mockUseAccountCount = useAccountCount as jest.MockedFunction<
  typeof useAccountCount
>;

describe('AccountCountDisplay', () => {
  const defaultMockData = {
    totalCount: 38,
    breakdown: [
      { id: 'wallet-1', name: 'Wallet 1', accountCount: 5 },
      { id: 'wallet-2', name: 'Wallet 2', accountCount: 20 },
      { id: 'imported', name: 'Imported', accountCount: 2 },
    ],
    hiddenCount: 2,
    isLoading: false,
  };

  beforeEach(() => {
    mockUseAccountCount.mockReturnValue(defaultMockData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('US1: View Total Account Count', () => {
    it('renders the total account count', () => {
      render(<AccountCountDisplay />);

      expect(screen.getByText('Total accounts:')).toBeInTheDocument();
      expect(screen.getByText('38')).toBeInTheDocument();
    });

    it('uses correct singular grammar for 1 account', () => {
      mockUseAccountCount.mockReturnValue({
        ...defaultMockData,
        totalCount: 1,
      });

      render(<AccountCountDisplay />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('1 account'),
      );
    });

    it('uses correct plural grammar for multiple accounts', () => {
      render(<AccountCountDisplay />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('38 accounts'),
      );
    });

    it('displays loading state when data is loading', () => {
      mockUseAccountCount.mockReturnValue({
        ...defaultMockData,
        isLoading: true,
      });

      render(<AccountCountDisplay />);

      expect(screen.getByText('Loading accounts...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-busy',
        'true',
      );
    });

    it('applies custom className when provided', () => {
      render(<AccountCountDisplay className="custom-class" />);

      expect(screen.getByTestId('account-count-display')).toHaveClass(
        'custom-class',
      );
    });

    it('uses custom data-testid when provided', () => {
      render(<AccountCountDisplay data-testid="custom-testid" />);

      expect(screen.getByTestId('custom-testid')).toBeInTheDocument();
    });
  });

  describe('US2: Wallet Breakdown on Hover', () => {
    it('shows breakdown on mouse enter', () => {
      render(<AccountCountDisplay />);

      const display = screen.getByTestId('account-count-display');
      fireEvent.mouseEnter(display);

      expect(
        screen.getByTestId('account-count-display-breakdown'),
      ).toBeInTheDocument();
      expect(screen.getByText('Wallet 1:')).toBeInTheDocument();
    });

    it('hides breakdown on mouse leave', () => {
      render(<AccountCountDisplay />);

      const display = screen.getByTestId('account-count-display');
      fireEvent.mouseEnter(display);
      fireEvent.mouseLeave(display);

      expect(
        screen.queryByTestId('account-count-display-breakdown'),
      ).not.toBeInTheDocument();
    });

    it('shows hidden accounts count in breakdown', () => {
      render(<AccountCountDisplay />);

      const display = screen.getByTestId('account-count-display');
      fireEvent.mouseEnter(display);

      expect(screen.getByText('Hidden:')).toBeInTheDocument();
      const hiddenSection = screen.getByText('Hidden:').closest('.account-count-breakdown__hidden');
      expect(hiddenSection).toHaveTextContent('2 accounts');
    });

    it('toggles breakdown on keyboard Enter', () => {
      render(<AccountCountDisplay />);

      const button = screen.getByRole('status');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(
        screen.getByTestId('account-count-display-breakdown'),
      ).toBeInTheDocument();
    });

    it('closes breakdown on keyboard Escape', () => {
      render(<AccountCountDisplay />);

      const button = screen.getByRole('status');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: 'Escape' });

      expect(
        screen.queryByTestId('account-count-display-breakdown'),
      ).not.toBeInTheDocument();
    });
  });

  describe('US3: Navigation to Accounts Menu', () => {
    it('calls onNavigateToAccounts when clicked', () => {
      const onNavigate = jest.fn();
      render(<AccountCountDisplay onNavigateToAccounts={onNavigate} />);

      const button = screen.getByRole('status');
      fireEvent.click(button);

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('has correct aria attributes for navigation', () => {
      render(<AccountCountDisplay />);

      const button = screen.getByRole('status');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Click to view accounts menu'),
      );
    });
  });

  describe('Accessibility', () => {
    it('has correct role="status" for screen readers', () => {
      render(<AccountCountDisplay />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for updates', () => {
      render(<AccountCountDisplay />);

      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-live',
        'polite',
      );
    });

    it('button is focusable', () => {
      render(<AccountCountDisplay />);

      const button = screen.getByRole('status');
      button.focus();

      expect(document.activeElement).toBe(button);
    });
  });
});
