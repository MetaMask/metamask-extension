import { KeyringObject, KeyringTypes } from '@metamask/keyring-controller';
import { isEqualCaseInsensitive } from './string-utils';

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

/**
 * Encodes a seed phrase as an array of UTF-8 byte values for JSON-RPC
 * serialization to the background.
 * @param seedPhrase
 */
export function encodeSeedPhraseForBackground(seedPhrase: string): number[] {
  return Array.from(Buffer.from(seedPhrase, 'utf8').values());
}

/**
 * Decodes a seed phrase from a background response (Buffer serialized as a
 * string or byte array) into a UTF-8 string.
 * @param encodedSeedPhrase
 */
export function decodeSeedPhraseFromBackground(
  encodedSeedPhrase: string | number[] | Uint8Array,
): string {
  return Buffer.from(encodedSeedPhrase).toString('utf8');
}
