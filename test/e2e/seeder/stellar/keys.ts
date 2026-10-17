import { SLIP10Node } from '@metamask/key-tree'; // eslint-disable-line import-x/no-extraneous-dependencies -- e2e HD derive; transitive via snaps
import { Keypair } from '@stellar/stellar-sdk'; // eslint-disable-line import-x/no-extraneous-dependencies -- e2e seeder; same as stellar mocks
import { E2E_SRP } from '../../constants';

/**
 * Derives the Stellar keypair for `E2E_SRP` at SEP-0005 path `m/44'/148'/accountIndex'`.
 * Index 0 is Account 1 (`DEFAULT_STELLAR_ADDRESS`).
 *
 * @param accountIndex - HD account index (0-based)
 * @returns Stellar keypair for that index
 */
export async function getE2eStellarKeypair(accountIndex = 0): Promise<Keypair> {
  if (!Number.isInteger(accountIndex) || accountIndex < 0) {
    throw new Error(
      `Stellar HD account index must be a non-negative integer, got ${accountIndex}`,
    );
  }

  const node = await SLIP10Node.fromDerivationPath({
    curve: 'ed25519',
    derivationPath: [
      `bip39:${E2E_SRP}`,
      `slip10:44'`,
      `slip10:148'`,
      `slip10:${accountIndex}'`,
    ],
  });
  const seed = node.privateKeyBytes;
  if (!seed) {
    throw new Error(
      `E2E Stellar SLIP-10 node at index ${accountIndex} has no private key`,
    );
  }

  return Keypair.fromRawEd25519Seed(Buffer.from(seed));
}
