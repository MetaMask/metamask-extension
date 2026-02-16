/**
 * AccountCountDisplay Component
 * Feature: account-count-display
 * User Story 1 (P1): View Total Account Count
 *
 * Displays the total number of accounts on the MetaMask home page.
 * Includes hover/tap breakdown (US2) and navigation (US3).
 */

import React, { useState, useCallback } from 'react';
import { useAccountCount } from '../../../hooks/useAccountCount';
import { AccountCountBreakdown } from './account-count-breakdown';
import type { AccountCountDisplayProps } from './account-count-display.types';
/**
 * Formats the account count with proper singular/plural grammar
 */
function formatAccountCount(count: number): string {
  return count === 1 ? '1 account' : `${count} accounts`;
}

/**
 * AccountCountDisplay - Shows total account count on home page
 *
 * Features:
 * - Displays "Total accounts: X" (US1)
 * - Shows breakdown on hover/tap (US2)
 * - Navigates to accounts menu on click (US3)
 * - Accessible with keyboard and screen readers
 */
export const AccountCountDisplay: React.FC<AccountCountDisplayProps> = ({
  className,
  onNavigateToAccounts,
  'data-testid': testId = 'account-count-display',
}) => {
  const { totalCount, breakdown, hiddenCount, isLoading } = useAccountCount();
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Handle hover for desktop
  const handleMouseEnter = useCallback(() => {
    setShowBreakdown(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowBreakdown(false);
  }, []);

  // Handle click for navigation (US3)
  const handleClick = useCallback(() => {
    if (onNavigateToAccounts) {
      onNavigateToAccounts();
    }
  }, [onNavigateToAccounts]);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Toggle breakdown on Enter/Space
      setShowBreakdown((prev) => !prev);
    }
    if (event.key === 'Escape') {
      setShowBreakdown(false);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`account-count-display account-count-display--loading ${className || ''}`}
        data-testid={testId}
        role="status"
        aria-busy="true"
      >
        <span className="account-count-display__loading-text">
          Loading accounts...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`account-count-display ${className || ''}`}
      data-testid={testId}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="account-count-display__button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={showBreakdown}
        aria-haspopup="true"
        role="status"
        aria-live="polite"
        aria-label={`Total accounts: ${formatAccountCount(totalCount)}. Click to view accounts menu.`}
      >
        <span className="account-count-display__label">Total accounts:</span>
        <span className="account-count-display__count">{totalCount}</span>
      </button>

      {/* Breakdown popover (US2) */}
      <AccountCountBreakdown
        breakdown={breakdown}
        hiddenCount={hiddenCount}
        isVisible={showBreakdown}
        onWalletClick={(wallet) => {
          console.log('Navigate to wallet:', wallet.name);
          onNavigateToAccounts?.();
        }}
        data-testid={`${testId}-breakdown`}
      />
    </div>
  );
};

export default AccountCountDisplay;
