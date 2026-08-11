import {
  VirtualAuthenticatorOptions,
  Transport,
  Protocol,
} from 'selenium-webdriver/lib/virtual_authenticator';
import type { PasskeyRecord } from '@metamask/passkey-controller';
import { Driver } from './driver';
import { PlaywrightDriver } from './driver-playwright';

type RawDriverWithVirtualAuth = {
  addVirtualAuthenticator: (
    options: VirtualAuthenticatorOptions,
  ) => Promise<void>;
  removeVirtualAuthenticator: () => Promise<void>;
};

function createPlatformAuthenticatorOptions(): VirtualAuthenticatorOptions {
  const authOptions = new VirtualAuthenticatorOptions();
  authOptions.setProtocol(Protocol.CTAP2);
  authOptions.setTransport(Transport.INTERNAL);
  authOptions.setHasResidentKey(true);
  authOptions.setHasUserVerification(true);
  authOptions.setIsUserVerified(true);
  authOptions.setIsUserConsenting(true);
  return authOptions;
}

function getRawDriver(driver: Driver): RawDriverWithVirtualAuth {
  return driver.driver as unknown as RawDriverWithVirtualAuth;
}

export async function addVirtualAuthenticator(
  driver: Driver | PlaywrightDriver,
): Promise<void> {
  // The Playwright driver implements the virtual authenticator itself via
  // the CDP WebAuthn domain; the Selenium path goes through the raw
  // WebDriver session. `instanceof` also works when `driver` is the
  // E2E_DEBUG logging proxy, since Proxy forwards getPrototypeOf.
  if (driver instanceof PlaywrightDriver) {
    await driver.addVirtualAuthenticator();
    return;
  }
  await getRawDriver(driver).addVirtualAuthenticator(
    createPlatformAuthenticatorOptions(),
  );
}

export async function removeVirtualAuthenticator(
  driver: Driver | PlaywrightDriver,
): Promise<void> {
  if (driver instanceof PlaywrightDriver) {
    await driver.removeVirtualAuthenticator();
    return;
  }
  await getRawDriver(driver).removeVirtualAuthenticator();
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
