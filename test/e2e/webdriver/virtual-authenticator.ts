import type { PasskeyRecord } from '@metamask/passkey-controller';
import { PlaywrightDriver } from './driver-playwright';

export async function addVirtualAuthenticator(
  driver: PlaywrightDriver,
): Promise<void> {
  await driver.addVirtualAuthenticator();
}

export async function removeVirtualAuthenticator(
  driver: PlaywrightDriver,
): Promise<void> {
  await driver.removeVirtualAuthenticator();
}

export const DUMMY_PASSKEY_RECORD: PasskeyRecord = {
  credential: {
    id: 'dummy-credential-id',
    publicKey: 'dummy-public-key',
    counter: 0,
    transports: ['internal'],
    aaguid: '00000000-0000-0000-0000-000000000000',
  },
  encryptedVaultKey: { ciphertext: 'dummy', iv: 'dummy' },
  keyDerivation: { method: 'userHandle' },
};
