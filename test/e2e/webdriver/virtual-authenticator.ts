import type { PasskeyRecord } from '@metamask/passkey-controller';
import { Driver } from './driver';
import { PlaywrightDriver } from './driver-playwright';

/**
 * WebAuthn virtual authenticator helpers.
 *
 * All passkey specs are migrated to Playwright, where the virtual
 * authenticator is implemented by the Playwright driver itself via the CDP
 * WebAuthn domain (Chromium-only). The former Selenium implementation
 * (selenium-webdriver's VirtualAuthenticatorOptions) has been removed.
 *
 * The `instanceof` check also works when `driver` is the E2E_DEBUG logging
 * proxy, since Proxy forwards getPrototypeOf.
 *
 * @param driver - The driver for the current test.
 */
export async function addVirtualAuthenticator(
  driver: Driver | PlaywrightDriver,
): Promise<void> {
  if (!(driver instanceof PlaywrightDriver)) {
    throw new Error(
      'virtualAuthenticator is only supported on the Playwright driver. ' +
        'Migrate the spec to Playwright (driverType: E2E_DRIVER.PLAYWRIGHT).',
    );
  }
  await driver.addVirtualAuthenticator();
}

export async function removeVirtualAuthenticator(
  driver: Driver | PlaywrightDriver,
): Promise<void> {
  if (!(driver instanceof PlaywrightDriver)) {
    throw new Error(
      'virtualAuthenticator is only supported on the Playwright driver. ' +
        'Migrate the spec to Playwright (driverType: E2E_DRIVER.PLAYWRIGHT).',
    );
  }
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
