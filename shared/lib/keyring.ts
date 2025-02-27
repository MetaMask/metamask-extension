import {
  KeyringObject,
  KeyringMetadata,
  KeyringTypes,
} from '@metamask/keyring-controller';

// TODO: This kind of logic should be inside the `KeyringController` (using `KeyringSelector` query, or make `addNewKeyring` returns it keyring ID alongside

export function findKeyringId(
  keyrings: KeyringObject[],
  keyringsMetadata: KeyringMetadata[],
  params: { address?: string; type?: KeyringTypes },
): string {
  const keyringIndex = keyrings.findIndex((keyring) => {
    if (params.address && params.type) {
      return (
        keyring.accounts.includes(params.address) &&
        keyring.type === params.type
      );
    }
    if (params.address) {
      return keyring.accounts.includes(params.address);
    }
    if (params.type) {
      return keyring.type === params.type;
    }
    throw new Error('Must provide either address or type parameter');
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
