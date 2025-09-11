import { KeyringObject, KeyringTypes } from '@metamask/keyring-controller';
import { isEqualCaseInsensitive } from '../modules/string-utils';

// TODO: This kind of logic should be inside the `KeyringController` (using `KeyringSelector` query, or make `addNewKeyring` returns it keyring ID alongside

export function findKeyringId(
  keyrings: KeyringObject[],
  selector: { address?: string; type?: KeyringTypes },
): string {
  const matchingKeyring = keyrings.find((keyring) => {
    if (selector.address && selector.type) {
      return (
        keyring.accounts.some((account) =>
          isEqualCaseInsensitive(account, selector.address as string),
        ) && keyring.type === selector.type
      );
    }
    if (selector.address) {
      return keyring.accounts.some((account) =>
        isEqualCaseInsensitive(account, selector.address as string),
      );
    }
    if (selector.type) {
      return keyring.type === selector.type;
    }

    throw new Error('Must provide either address or type selector');
  });
  if (!matchingKeyring) {
    throw new Error('Could not find keyring with specified criteria');
  }

  return matchingKeyring.metadata.id;
}

export function findKeyringIdByAddress(
  keyrings: KeyringObject[],
  address: string,
): string {
  return findKeyringId(keyrings, { address });
}
