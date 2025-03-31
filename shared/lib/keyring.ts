import {
  KeyringObject,
  KeyringMetadata,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { isEqualCaseInsensitive } from '../modules/string-utils';

// TODO: This kind of logic should be inside the `KeyringController` (using `KeyringSelector` query, or make `addNewKeyring` returns it keyring ID alongside

export function findKeyringId(
  keyrings: KeyringObject[],
  keyringsMetadata: KeyringMetadata[],
  selector: { address?: string; type?: KeyringTypes },
): string {
  const keyringIndex = keyrings.findIndex((keyring) => {
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
  if (keyringIndex === -1) {
    throw new Error('Could not find keyring with specified criteria');
  }

  return keyringsMetadata[keyringIndex].id;
}

export function findKeyringIdByAddress(
  keyrings: KeyringObject[],
  keyringsMetadata: KeyringMetadata[],
  address: string,
): string {
  return findKeyringId(keyrings, keyringsMetadata, { address });
}
