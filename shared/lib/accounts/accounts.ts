import { InternalAccount } from '@metamask/keyring-internal-api';

/**
 * Get the next available account name based on the suggestion and the list of
 * accounts.
 *
 * @param accounts - The list of accounts to check for name availability
 * @param nameSuggestion - The suggested name for the account
 * @returns The next available account name based on the suggestion
 */
export function getUniqueAccountName(
  accounts: InternalAccount[],
  nameSuggestion: string,
): string {
  let suffix = 1;
  let candidateName = nameSuggestion;

  const isNameTaken = (name: string) =>
    accounts.some((account) => account.metadata.name === name);

  while (isNameTaken(candidateName)) {
    suffix += 1;
    candidateName = `${nameSuggestion} ${suffix}`;
  }

  return candidateName;
}
