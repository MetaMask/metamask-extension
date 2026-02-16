import { MPCKeyringOpts, MPCKeyring } from '@metamask/eth-mpc-keyring';
import { loadSync as loadDkls19Lib } from '@metamask/tss-dkls19-lib';
import {
  keyringBuilderFactory,
  KeyringController,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { QrKeyring, QrKeyringScannerBridge } from '@metamask/eth-qr-keyring';
import { KeyringClass } from '@metamask/keyring-utils';
import LatticeKeyring from 'eth-lattice-keyring';
import {
  OneKeyKeyring,
  TrezorConnectBridge,
  TrezorKeyring,
} from '@metamask/eth-trezor-keyring';
import {
  LedgerIframeBridge,
  LedgerKeyring,
} from '@metamask/eth-ledger-bridge-keyring';
import { p256 } from '@noble/curves/nist';
import { sha256 } from '@noble/hashes/sha2';
import { hardwareKeyringBuilderFactory } from '../lib/hardware-keyring-builder-factory';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { qrKeyringBuilderFactory } from '../lib/qr-keyring-builder-factory';
import { encryptorFactory } from '../lib/encryptor-factory';
import { TrezorOffscreenBridge } from '../lib/offscreen-bridge/trezor-offscreen-bridge';
import { LedgerOffscreenBridge } from '../lib/offscreen-bridge/ledger-offscreen-bridge';
import { LatticeKeyringOffscreen } from '../lib/offscreen-bridge/lattice-offscreen-keyring';
import {
  getJwtSecretKey,
  getMfaRelayerUrl,
  getMfaCloudSignerUrl,
} from '../../../shared/modules/environment';
import { ControllerInitFunction } from './types';
import {
  KeyringControllerMessenger,
  KeyringControllerInitMessenger,
} from './messengers';

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes =
    typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/[=]/gu, '');
}

/**
 * Extract raw private key bytes from a PEM-encoded EC private key.
 * Parses the DER structure to find the 32-byte private key for P-256 (secp256r1).
 *
 * @param pem - PEM-encoded EC private key string
 * @returns 32-byte Uint8Array containing the raw private key
 */
function pemToPrivateKeyBytes(pem: string): Uint8Array {
  // Remove PEM headers and decode base64
  const base64 = pem
    .replace(/-----BEGIN EC PRIVATE KEY-----/u, '')
    .replace(/-----END EC PRIVATE KEY-----/u, '')
    .replace(/\s/gu, '');

  const der = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // Parse DER structure to extract the private key
  // EC Private Key format (RFC 5915):
  // SEQUENCE {
  //   INTEGER 1 (version)
  //   OCTET STRING (private key bytes)
  //   [0] OID (curve) - optional
  //   [1] BIT STRING (public key) - optional
  // }

  let offset = 0;

  // Skip SEQUENCE tag (0x30) and length
  if (der[offset] !== 0x30) {
    throw new Error('Invalid DER: expected SEQUENCE');
  }
  offset += 1;
  // eslint-disable-next-line no-bitwise
  const lengthByte = der[offset];
  // eslint-disable-next-line no-bitwise
  offset += (lengthByte & 0x80) === 0 ? 1 : (lengthByte & 0x7f) + 1;

  // Skip INTEGER (version = 1)
  if (der[offset] !== 0x02) {
    throw new Error('Invalid DER: expected INTEGER for version');
  }
  offset += 1;
  const versionLength = der[offset];
  offset += 1 + versionLength;

  // Read OCTET STRING (private key)
  if (der[offset] !== 0x04) {
    throw new Error('Invalid DER: expected OCTET STRING for private key');
  }
  offset += 1;
  const keyLength = der[offset];
  offset += 1;

  if (keyLength !== 32) {
    throw new Error(`Unexpected private key length: ${keyLength}, expected 32`);
  }

  return der.slice(offset, offset + keyLength);
}

/**
 * Synchronously sign a JWT using ES256 (P-256/secp256r1)
 *
 * @param payload
 * @param privateKeyBytes
 */
function signJwtSync(
  payload: Record<string, unknown>,
  privateKeyBytes: Uint8Array,
): string {
  const header = { alg: 'ES256', typ: 'JWT' };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  // Hash the message
  const messageHash = sha256(new TextEncoder().encode(message));

  // Sign synchronously with P-256
  const signature = p256.sign(messageHash, privateKeyBytes);

  // Convert signature to compact format (r || s)
  const encodedSignature = base64UrlEncode(signature.toCompactRawBytes());

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

function generateToken(jwtSecretKeyPem: string, userId: string): string {
  try {
    const privateKeyBytes = pemToPrivateKeyBytes(jwtSecretKeyPem);

    return signJwtSync(
      {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        channels: ['*'],
      },
      privateKeyBytes,
    );
  } catch (error) {
    console.error('Failed to generate JWT token', error);
    throw new Error('Failed to generate JWT token', { cause: error });
  }
}

/**
 * Initialize the keyring controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.initMessenger - The messenger to use for initialization
 * actions.
 * @param request.keyringOverrides - Optional overrides for keyring classes and
 * bridges.
 * @param request.encryptor - Optional encryptor to use for the controller.
 * @param request.getController - Function to get other controllers.
 * @returns The initialized controller.
 */
export const KeyringControllerInit: ControllerInitFunction<
  KeyringController,
  KeyringControllerMessenger,
  KeyringControllerInitMessenger
> = ({
  controllerMessenger,
  persistedState,
  initMessenger,
  keyringOverrides,
  encryptor,
  getController,
}) => {
  const additionalKeyrings = [
    qrKeyringBuilderFactory(
      keyringOverrides?.qr || (QrKeyring as unknown as KeyringClass),
      keyringOverrides?.qrBridge || QrKeyringScannerBridge,
      {
        requestScan: async (request) =>
          initMessenger.call('AppStateController:requestQrCodeScan', request),
      },
    ),
  ];

  if (isManifestV3 === false) {
    additionalKeyrings.push(
      keyringBuilderFactory(
        keyringOverrides?.lattice ||
          (LatticeKeyring as unknown as KeyringClass),
      ),
      hardwareKeyringBuilderFactory(
        TrezorKeyring as unknown as KeyringClass,
        keyringOverrides?.trezorBridge || TrezorConnectBridge,
      ),
      hardwareKeyringBuilderFactory(
        OneKeyKeyring as unknown as KeyringClass,
        keyringOverrides?.oneKey || TrezorConnectBridge,
      ),
      hardwareKeyringBuilderFactory(
        LedgerKeyring as unknown as KeyringClass,
        keyringOverrides?.ledgerBridge || LedgerIframeBridge,
      ),
    );
  } else {
    additionalKeyrings.push(
      hardwareKeyringBuilderFactory(
        TrezorKeyring as unknown as KeyringClass,
        keyringOverrides?.trezorBridge || TrezorOffscreenBridge,
      ),
      hardwareKeyringBuilderFactory(
        OneKeyKeyring as unknown as KeyringClass,
        keyringOverrides?.oneKey || TrezorOffscreenBridge,
      ),
      hardwareKeyringBuilderFactory(
        LedgerKeyring as unknown as KeyringClass,
        keyringOverrides?.ledgerBridge || LedgerOffscreenBridge,
      ),
      keyringBuilderFactory(LatticeKeyringOffscreen as unknown as KeyringClass),
    );
  }

  // MPC Keyring
  {
    const cloudURL = getMfaCloudSignerUrl();
    const relayerURL = getMfaRelayerUrl();
    if (!cloudURL || !relayerURL) {
      throw new Error('MFA cloud signer or relayer URL is not set');
    }
    const dkls19Lib = loadDkls19Lib();
    const jwtSecretKey = getJwtSecretKey();
    const opts: MPCKeyringOpts = {
      getRandomBytes: (length: number) =>
        crypto.getRandomValues(new Uint8Array(length)),
      dkls19Lib,
      cloudURL,
      relayerURL,
      webSocket: WebSocket,
      getTransportToken: jwtSecretKey
        ? () => Promise.resolve(generateToken(jwtSecretKey, 'MetaMask Client'))
        : undefined,
      getVerifierToken: (verifierId: string) => {
        // Mock JWT token for verifier
        const token = JSON.stringify({
          sub: verifierId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          channels: ['*'],
        });
        return Promise.resolve(token);
      },
    };
    additionalKeyrings.push(
      Object.assign(() => new MPCKeyring(opts), { type: KeyringTypes.mpc }),
    );
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const snapKeyringBuilder = getController('SnapKeyringBuilder');

  // @ts-expect-error: `addAccounts` is missing in `SnapKeyring` type.
  additionalKeyrings.push(snapKeyringBuilder);
  ///: END:ONLY_INCLUDE_IF

  const controller = new KeyringController({
    state: persistedState.KeyringController,
    messenger: controllerMessenger,
    keyringBuilders: additionalKeyrings,
    encryptor: encryptor || encryptorFactory(600_000),
  });

  return {
    controller,
  };
};
