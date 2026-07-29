/**
 * The keyring surface exposed to lock-free hardware `deviceRead` callbacks
 * (see `MetamaskController.#withKeyringForDevice`).
 *
 * Device reads run outside the KeyringController operation mutex, so the
 * callback must not be able to mutate persisted keyring state. Rather than
 * relying on convention, `restrictKeyringForDeviceRead` hands the callback a
 * frozen facade that only exposes the read-side surface: mutating methods
 * (`createAccounts`, `deleteAccount`, `forgetDevice`, `setHdPath`,
 * `deserialize`, ...) do not exist on it, so misuse fails at call time
 * instead of silently corrupting unlocked state.
 */

import type { LedgerKeyring as LedgerKeyringV2 } from '@metamask/eth-ledger-bridge-keyring/v2';
import type { QrKeyring as QrKeyringV2 } from '@metamask/eth-qr-keyring/v2';
import type { TrezorKeyring as TrezorKeyringV2 } from '@metamask/eth-trezor-keyring/v2';
import type { LatticeKeyringV2 } from './offscreen-bridge/lattice-keyring-v2';

/**
 * Every public member across the hardware keyring V2 wrappers the extension
 * registers (OneKey shares the Trezor wrapper class). Constraining
 * {@link DEVICE_READ_METHODS} against this union makes an upstream method
 * rename a compile error here instead of a runtime `TypeError` in the
 * hardware flows.
 */
type KnownHardwareKeyringMember =
  | keyof TrezorKeyringV2
  | keyof LedgerKeyringV2
  | keyof QrKeyringV2
  | keyof LatticeKeyringV2;

/**
 * Read-only methods a hardware keyring V2 wrapper may expose. Only the
 * methods relevant to the wrapped device are present on the facade (e.g.
 * `getModel` exists for Trezor/OneKey, `getAppNameAndVersion` for Ledger).
 */
const DEVICE_READ_METHODS = [
  'getFirstPage',
  'getNextPage',
  'getPreviousPage',
  'isUnlocked',
  'getModel',
  'getName',
  'attemptMakeApp',
  'getAppNameAndVersion',
] as const satisfies readonly KnownHardwareKeyringMember[];

type DeviceReadMethodName = (typeof DEVICE_READ_METHODS)[number];

/**
 * Minimal structural view of a hardware keyring V2 wrapper, as needed to
 * build the device-read facade.
 */
type HardwareKeyringLike = {
  readonly hdPath?: string;
  readonly bridge?: unknown;
} & Partial<Record<DeviceReadMethodName, (...args: never[]) => unknown>>;

type DeviceReadKeyring<Keyring extends HardwareKeyringLike> = Readonly<
  Pick<Keyring, Extract<keyof Keyring, DeviceReadMethodName>> & {
    hdPath: Keyring['hdPath'];
    bridge: Keyring['bridge'];
  }
>;

/**
 * Build the restricted, read-only keyring facade handed to hardware
 * `deviceRead` callbacks.
 *
 * `hdPath` and `bridge` are exposed as live getters (`bridge` is required by
 * the Ledger/Trezor feature and public-key probes; it is transport-level
 * state, not vault state). Read methods are bound to the underlying keyring
 * so `this` stays intact. Anything else — in particular every mutating
 * method — is absent, and the facade itself is frozen.
 *
 * @param keyring - The hardware keyring V2 wrapper selected for the device.
 * @returns A frozen facade exposing only the device-read surface.
 */
export function restrictKeyringForDeviceRead<
  Keyring extends HardwareKeyringLike,
>(keyring: Keyring): DeviceReadKeyring<Keyring> {
  const facade = {
    get hdPath() {
      return keyring.hdPath;
    },
    get bridge() {
      return keyring.bridge;
    },
  };

  for (const method of DEVICE_READ_METHODS) {
    const value = keyring[method];
    if (typeof value === 'function') {
      Object.defineProperty(facade, method, {
        value: value.bind(keyring),
        enumerable: true,
      });
    }
  }

  return Object.freeze(facade) as DeviceReadKeyring<Keyring>;
}
