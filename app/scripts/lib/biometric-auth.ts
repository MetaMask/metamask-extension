/**
 * Biometric Authentication via WebAuthn PRF Extension
 *
 * Uses the platform authenticator (Touch ID / Windows Hello / etc.) with
 * the PRF (Pseudo-Random Function) extension to derive a symmetric key.
 * That key encrypts the user's vault password, which is stored locally.
 * On biometric unlock, the PRF output decrypts the password, which is
 * then submitted through the normal vault unlock flow.
 *
 * Security model:
 * - The password never leaves the device unencrypted
 * - The encryption key is bound to the authenticator and cannot be exported
 * - PRF output is deterministic per credential + salt, but secret
 * - Falling back to password is always available
 */

const BIOMETRIC_STORAGE_KEY = 'biometricAuth';
const PRF_SALT = new TextEncoder().encode('MetaMask-biometric-v1');

type BiometricStorageData = {
  credentialId: string;
  encryptedPassword: string;
  iv: string;
  enrolled: boolean;
};

/**
 * Check if the current environment supports WebAuthn with PRF.
 * Requires a platform authenticator (built-in biometric sensor).
 */
export async function isBiometricSupported(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return false;
  }

  try {
    const available =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Derive an AES-GCM key from a WebAuthn PRF output.
 */
async function deriveKeyFromPrf(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    prfOutput,
    'HKDF',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: PRF_SALT,
      info: new TextEncoder().encode('password-encryption'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt the user's password with the PRF-derived key.
 */
async function encryptPassword(
  key: CryptoKey,
  password: string,
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(password);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  return { ciphertext, iv };
}

/**
 * Decrypt the user's password with the PRF-derived key.
 */
async function decryptPassword(
  key: CryptoKey,
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getStoredData(): Promise<BiometricStorageData | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(BIOMETRIC_STORAGE_KEY, (result) => {
      resolve(
        (result[BIOMETRIC_STORAGE_KEY] as BiometricStorageData) ?? null,
      );
    });
  });
}

async function setStoredData(data: BiometricStorageData): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [BIOMETRIC_STORAGE_KEY]: data }, resolve);
  });
}

async function removeStoredData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(BIOMETRIC_STORAGE_KEY, resolve);
  });
}

/**
 * Enroll biometric authentication.
 * Creates a new WebAuthn credential with PRF, then encrypts and stores
 * the user's vault password.
 *
 * @param password - The user's current vault password (already verified)
 * @returns true if enrollment succeeded
 */
export async function enrollBiometric(password: string): Promise<boolean> {
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: {
        name: 'MetaMask',
        id: globalThis.location?.hostname || 'metamask',
      },
      user: {
        id: userId,
        name: 'metamask-user',
        displayName: 'MetaMask User',
      },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      extensions: {
        prf: {
          eval: {
            first: PRF_SALT,
          },
        },
      },
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    return false;
  }

  // Extract PRF results from the creation response
  const extensionResults =
    (credential.getClientExtensionResults() as Record<string, unknown>)
      ?.prf as { enabled?: boolean; results?: { first?: ArrayBuffer } } | undefined;

  if (!extensionResults?.enabled && !extensionResults?.results) {
    // PRF not supported - try a fallback: authenticate immediately to get PRF output
    // Some authenticators only return PRF on get(), not create()
    const prfOutput = await authenticateForPrf(credential.rawId);
    if (!prfOutput) {
      await removeStoredData();
      return false;
    }

    const key = await deriveKeyFromPrf(prfOutput);
    const { ciphertext, iv } = await encryptPassword(key, password);

    await setStoredData({
      credentialId: arrayBufferToBase64(credential.rawId),
      encryptedPassword: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      enrolled: true,
    });

    return true;
  }

  // PRF was returned directly from create()
  if (extensionResults?.results?.first) {
    const key = await deriveKeyFromPrf(extensionResults.results.first);
    const { ciphertext, iv } = await encryptPassword(key, password);

    await setStoredData({
      credentialId: arrayBufferToBase64(credential.rawId),
      encryptedPassword: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      enrolled: true,
    });

    return true;
  }

  // PRF is enabled but didn't return results on create - authenticate to get them
  if (extensionResults?.enabled) {
    const prfOutput = await authenticateForPrf(credential.rawId);
    if (!prfOutput) {
      await removeStoredData();
      return false;
    }

    const key = await deriveKeyFromPrf(prfOutput);
    const { ciphertext, iv } = await encryptPassword(key, password);

    await setStoredData({
      credentialId: arrayBufferToBase64(credential.rawId),
      encryptedPassword: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      enrolled: true,
    });

    return true;
  }

  return false;
}

/**
 * Authenticate with the platform authenticator and return the PRF output.
 */
async function authenticateForPrf(
  credentialId: ArrayBuffer,
): Promise<ArrayBuffer | null> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [
        {
          id: credentialId,
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      extensions: {
        prf: {
          eval: {
            first: PRF_SALT,
          },
        },
      },
    },
  })) as PublicKeyCredential | null;

  if (!assertion) {
    return null;
  }

  const prfExtension =
    (assertion.getClientExtensionResults() as Record<string, unknown>)
      ?.prf as { results?: { first?: ArrayBuffer } } | undefined;

  return prfExtension?.results?.first ?? null;
}

/**
 * Unlock the wallet using biometric authentication.
 * Authenticates via WebAuthn PRF, decrypts the stored password,
 * and returns it for submission to the vault.
 *
 * @returns The decrypted vault password, or null if authentication failed
 */
export async function authenticateBiometric(): Promise<string | null> {
  const stored = await getStoredData();
  if (!stored?.enrolled) {
    return null;
  }

  const credentialId = base64ToArrayBuffer(stored.credentialId);
  const prfOutput = await authenticateForPrf(credentialId);

  if (!prfOutput) {
    return null;
  }

  try {
    const key = await deriveKeyFromPrf(prfOutput);
    const ciphertext = base64ToArrayBuffer(stored.encryptedPassword);
    const iv = new Uint8Array(base64ToArrayBuffer(stored.iv));

    return await decryptPassword(key, ciphertext, iv);
  } catch {
    // Decryption failed - credential may have changed
    return null;
  }
}

/**
 * Check if biometric authentication is enrolled.
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  const stored = await getStoredData();
  return stored?.enrolled === true;
}

/**
 * Remove biometric enrollment.
 */
export async function unenrollBiometric(): Promise<void> {
  await removeStoredData();
}

/**
 * Re-encrypt the password after a password change.
 * Must be called when the user changes their vault password.
 *
 * @param newPassword - The new vault password
 */
export async function updateBiometricPassword(
  newPassword: string,
): Promise<boolean> {
  const stored = await getStoredData();
  if (!stored?.enrolled) {
    return false;
  }

  const credentialId = base64ToArrayBuffer(stored.credentialId);
  const prfOutput = await authenticateForPrf(credentialId);

  if (!prfOutput) {
    return false;
  }

  const key = await deriveKeyFromPrf(prfOutput);
  const { ciphertext, iv } = await encryptPassword(key, newPassword);

  await setStoredData({
    ...stored,
    encryptedPassword: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  });

  return true;
}
