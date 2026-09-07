import type { Hex } from '@metamask/utils';

/**
 * Result of committing a Money Account withdrawal amount. Crosses the
 * background→UI bridge, so it carries the recipient the commit actually
 * encoded: the UI's Confirm gate compares it against the recipient currently
 * displayed, which can change between commits.
 */
export type WithdrawAmountCommitResult =
  | { didCommit: true; recipient: Hex }
  | { didCommit: false };
