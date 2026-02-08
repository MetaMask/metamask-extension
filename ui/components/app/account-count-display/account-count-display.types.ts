/**
 * Account Count Display - Type Definitions
 * Feature: account-count-display
 */

/**
 * Breakdown of accounts by wallet/source
 */
export interface WalletBreakdown {
  /** Unique identifier for the wallet */
  id: string;
  /** Display name (e.g., "Wallet 1", "Imported", "Ledger") */
  name: string;
  /** Number of accounts in this wallet */
  accountCount: number;
}

/**
 * Data returned by useAccountCount hook
 */
export interface AccountCountData {
  /** Total number of accounts across all sources */
  totalCount: number;
  /** Breakdown by wallet/source */
  breakdown: WalletBreakdown[];
  /** Number of hidden accounts (included in totalCount) */
  hiddenCount: number;
  /** True while data is loading */
  isLoading: boolean;
}

/**
 * Props for AccountCountDisplay component
 */
export interface AccountCountDisplayProps {
  /** Optional CSS class name */
  className?: string;
  /** Callback when navigating to accounts menu */
  onNavigateToAccounts?: () => void;
  /** Test ID for E2E testing */
  'data-testid'?: string;
}

/**
 * Props for AccountCountBreakdown component
 */
export interface AccountCountBreakdownProps {
  /** Wallet breakdown data */
  breakdown: WalletBreakdown[];
  /** Number of hidden accounts */
  hiddenCount: number;
  /** Callback when clicking a wallet */
  onWalletClick?: (wallet: WalletBreakdown) => void;
  /** Whether breakdown is visible */
  isVisible: boolean;
  /** Test ID for E2E testing */
  'data-testid'?: string;
}
