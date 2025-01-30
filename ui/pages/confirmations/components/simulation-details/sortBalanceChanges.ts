import { TokenStandard } from '../../../../../shared/constants/transaction';
import { BalanceChange, FIAT_UNAVAILABLE } from './types';

/** Comparator function for comparing two BalanceChange objects. */
type BalanceChangeComparator = (a: BalanceChange, b: BalanceChange) => number;

/** Order of token standards for comparison. */
const tokenStandardOrder: TokenStandard[] = [
  TokenStandard.none,
  TokenStandard.ERC20,
  TokenStandard.ERC721,
  TokenStandard.ERC1155,
];

// Compares BalanceChange objects based on fiat amount.
const byFiatAmount: BalanceChangeComparator = (a, b) => {
  if (a.fiatAmount === b.fiatAmount) {
    return 0;
  }
  if (a.fiatAmount === FIAT_UNAVAILABLE) {
    return 1;
  }
  if (b.fiatAmount === FIAT_UNAVAILABLE) {
    return -1;
  }
  return b.fiatAmount - a.fiatAmount;
};

// Compares BalanceChange objects based on token standard.
const byTokenStandard: BalanceChangeComparator = (a, b) => {
  const indexA = tokenStandardOrder.indexOf(a.asset.standard);
  const indexB = tokenStandardOrder.indexOf(b.asset.standard);
  return indexA - indexB;
};

/** Array of comparator functions for BalanceChange objects. */
const comparators: BalanceChangeComparator[] = [byFiatAmount, byTokenStandard];

/**
 * Compares BalanceChange objects based on multiple criteria.
 *
 * @param a
 * @param b
 */
export const compareBalanceChanges: BalanceChangeComparator = (a, b) => {
  for (const comparator of comparators) {
    const result = comparator(a, b);
    if (result !== 0) {
      return result;
    }
  }
  return 0;
};

/**
 * Sorts an array of balance changes based on multiple criteria
 *
 * @param balanceChanges
 */
export const sortBalanceChanges = (
  balanceChanges: BalanceChange[],
): BalanceChange[] => {
  return [...balanceChanges].sort(compareBalanceChanges);
};
