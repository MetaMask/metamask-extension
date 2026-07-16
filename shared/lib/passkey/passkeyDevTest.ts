import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  bufferToBase64URLString,
  type PublicKeyCredentialCreationOptionsJSON as SwaCreateOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON as SwaGetOptionsJSON,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/browser';

const PASSKEY_DEV_CREDENTIAL_ID_KEY = 'passkey_dev_test_credential_id';
const PASSKEY_DEV_USER_ID_KEY = 'passkey_dev_test_user_id';

/**
 * Shared rpId for cross-surface passkey dev testing (extension ↔ mobile).
 * Must match mobile `PASSKEY_RP_ID_*` and host `/.well-known/webauthn` (ROR)
 * plus platform association files (AASA / assetlinks).
 */
export const PASSKEY_RP_ID =
  process.env.PASSKEY_RP_ID?.toString().trim() || 'matthiasgeihs.github.io';
export const PASSKEY_RP_NAME = 'MetaMask';

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bufferToBase64URLString(bytes);
}

function getDevStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setDevStorageItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function removeDevStorageItems(keys: string[]): void {
  keys.forEach((key) => localStorage.removeItem(key));
}

async function getOrCreateDevUserId(): Promise<string> {
  const existingUserId = getDevStorageItem(PASSKEY_DEV_USER_ID_KEY);
  if (existingUserId) {
    return existingUserId;
  }

  const userId = randomBase64Url(16);
  setDevStorageItem(PASSKEY_DEV_USER_ID_KEY, userId);
  return userId;
}

export function buildPasskeyCreateOptions(
  userId: string,
): SwaCreateOptionsJSON {
  return {
    challenge: randomBase64Url(32),
    rp: {
      id: PASSKEY_RP_ID,
      name: PASSKEY_RP_NAME,
    },
    user: {
      id: userId,
      name: 'metamask-dev-tester',
      displayName: 'MetaMask Dev Tester',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    timeout: 60_000,
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      userVerification: 'preferred',
    },
    attestation: 'none',
  };
}

export async function buildPasskeyGetOptions(): Promise<SwaGetOptionsJSON> {
  const storedCredentialId = getDevStorageItem(PASSKEY_DEV_CREDENTIAL_ID_KEY);

  return {
    challenge: randomBase64Url(32),
    rpId: PASSKEY_RP_ID,
    timeout: 60_000,
    userVerification: 'preferred',
    ...(storedCredentialId
      ? {
          allowCredentials: [
            {
              type: 'public-key' as const,
              id: storedCredentialId,
            },
          ],
        }
      : {}),
  };
}

export async function createDevPasskey(): Promise<RegistrationResponseJSON> {
  if (!browserSupportsWebAuthn()) {
    throw new Error('Passkeys are not supported in this browser context.');
  }

  const userId = await getOrCreateDevUserId();
  const result = await startRegistration({
    optionsJSON: buildPasskeyCreateOptions(userId),
  });

  setDevStorageItem(PASSKEY_DEV_CREDENTIAL_ID_KEY, result.id);
  return result;
}

export async function verifyDevPasskey(): Promise<AuthenticationResponseJSON> {
  if (!browserSupportsWebAuthn()) {
    throw new Error('Passkeys are not supported in this browser context.');
  }

  const request = await buildPasskeyGetOptions();
  return startAuthentication({ optionsJSON: request });
}

export function clearDevPasskeyState(): void {
  removeDevStorageItems([
    PASSKEY_DEV_CREDENTIAL_ID_KEY,
    PASSKEY_DEV_USER_ID_KEY,
  ]);
}
