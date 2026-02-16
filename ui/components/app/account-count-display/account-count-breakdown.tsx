/**
 * AccountCountBreakdown Component
 * Feature: account-count-display
 * User Story 2 (P2): Wallet Breakdown on Hover
 *
 * Shows wallet-by-wallet breakdown in a popover when hovering over the count.
 */

import React from 'react';
import type {
  AccountCountBreakdownProps,
  WalletBreakdown,
} from './account-count-display.types';
/**
 * Formats the account count with proper singular/plural grammar
 */
function formatAccountCount(count: number): string {
  return count === 1 ? '1 account' : `${count} accounts`;
}

/**
 * AccountCountBreakdown - Shows wallet breakdown in popover
 *
 * Features:
 * - Lists all wallets with their account counts
 * - Shows hidden accounts at the bottom
 * - Each wallet is clickable to navigate (US3)
 * - Accessible with keyboard navigation
 */
export const AccountCountBreakdown: React.FC<AccountCountBreakdownProps> = ({
  breakdown,
  hiddenCount,
  onWalletClick,
  isVisible,
  'data-testid': testId = 'account-count-breakdown',
}) => {
  if (!isVisible) {
    return null;
  }

  const handleWalletClick = (wallet: WalletBreakdown) => {
    if (onWalletClick) {
      onWalletClick(wallet);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    wallet: WalletBreakdown,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleWalletClick(wallet);
    }
  };

  return (
    <div
      className="account-count-breakdown"
      data-testid={testId}
      role="tooltip"
      aria-label="Account breakdown by wallet"
    >
      <ul className="account-count-breakdown__list" role="list">
        {breakdown.map((wallet) => (
          <li key={wallet.id} className="account-count-breakdown__item">
            <button
              className="account-count-breakdown__wallet-button"
              onClick={() => handleWalletClick(wallet)}
              onKeyDown={(e) => handleKeyDown(e, wallet)}
              aria-label={`${wallet.name}: ${formatAccountCount(wallet.accountCount)}. Click to view.`}
            >
              <span className="account-count-breakdown__wallet-name">
                {wallet.name}:
              </span>
              <span className="account-count-breakdown__wallet-count">
                {formatAccountCount(wallet.accountCount)}
              </span>
            </button>
          </li>
        ))}

        {/* Hidden accounts section */}
        {hiddenCount > 0 && (
          <li className="account-count-breakdown__item account-count-breakdown__item--hidden">
            <div className="account-count-breakdown__hidden">
              <span className="account-count-breakdown__hidden-label">
                Hidden:
              </span>
              <span className="account-count-breakdown__hidden-count">
                {formatAccountCount(hiddenCount)}
              </span>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

export default AccountCountBreakdown;
