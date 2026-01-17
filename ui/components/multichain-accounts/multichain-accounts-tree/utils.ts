import { MergedInternalAccount } from '../../../selectors/selectors.types';

/**
 * Checks if the account matches the search pattern.
 *
 * @param pattern - The search pattern to match against.
 * @param account - The account to check.
 * @returns True if the account matches the search pattern, false otherwise.
 */
export const matchesSearchPattern = (
  pattern: string,
  account: MergedInternalAccount,
): boolean => {
  const lowercasedPattern = pattern.toLowerCase();
  return (
    (typeof account.metadata.name === 'string' &&
      account.metadata.name.toLowerCase().includes(lowercasedPattern)) ||
    (typeof account.address === 'string' &&
      account.address.toLowerCase().includes(lowercasedPattern))
  );
};
