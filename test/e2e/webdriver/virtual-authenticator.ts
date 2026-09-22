import {
  VirtualAuthenticatorOptions,
  Transport,
  Protocol,
  Credential as VirtualAuthenticatorCredential,
} from 'selenium-webdriver/lib/virtual_authenticator';
import type { PasskeyRecord } from '@metamask/passkey-controller';
import { Driver } from './driver';
import {
  getLegacyPasskeyPrivateKey,
  LEGACY_PASSKEY_CREDENTIAL_ID,
  LEGACY_PASSKEY_USER_HANDLE,
} from './legacy-passkey-fixture';

type RawDriverWithVirtualAuth = {
  addCredential: (credential: VirtualAuthenticatorCredential) => Promise<void>;
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

export async function addVirtualAuthenticator(driver: Driver): Promise<void> {
  await getRawDriver(driver).addVirtualAuthenticator(
    createPlatformAuthenticatorOptions(),
  );
}

export async function removeVirtualAuthenticator(
  driver: Driver,
): Promise<void> {
  await getRawDriver(driver).removeVirtualAuthenticator();
}

/**
 * Loads the legacy userHandle credential that matches
 * {@link getLegacyUserHandlePasskeyRecord}.
 *
 * @param driver - WebDriver instance with a virtual authenticator attached.
 * @param extensionId - Unpacked extension id, used as the WebAuthn RP ID.
 */
export async function addLegacyUserHandlePasskeyCredential(
  driver: Driver,
  extensionId: string,
): Promise<void> {
  await getRawDriver(driver).addCredential(
    VirtualAuthenticatorCredential.createResidentCredential(
      LEGACY_PASSKEY_CREDENTIAL_ID,
      `chrome-extension://${extensionId}`,
      LEGACY_PASSKEY_USER_HANDLE,
      getLegacyPasskeyPrivateKey(),
      0,
    ),
  );
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
