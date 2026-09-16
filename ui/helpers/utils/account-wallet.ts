import { AccountWalletType } from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  MetaMetricsEventAccountType,
  MetaMetricsHardwareWalletDeviceType,
} from '../../../shared/constants/metametrics';

/**
 * Imported private-key wallets hold a single account that the user can delete
 * and restore at will, so they are managed differently from every other wallet.
 *
 * @param wallet - Wallet object from the account tree.
 * @returns True when the wallet is a simple (imported private key) keyring.
 */
export function isPrivateKeyWallet(wallet: AccountWalletObject): boolean {
  return (
    wallet.type === AccountWalletType.Keyring &&
    wallet.metadata.keyring.type === KeyringTypes.simple
  );
}

/**
 * Keyring types that map to a Segment hardware device name.
 *
 * Mirrors `HARDWARE_WALLET_TYPE_KEY_TO_SEGMENT_DEVICE_TYPE` in
 * `shared/lib/hardware-wallet-recovery-metrics.ts`, which cannot be reused
 * directly because it is keyed on short wallet-type keys (`ledger`, `qr`)
 * rather than the {@link KeyringTypes} values stored on a keyring wallet.
 * As documented there, the Segment schema only defines these four devices.
 *
 * OneKey connects over air-gapped QR codes, so it reports as `QR Hardware` —
 * the same grouping the `number_of_qr_hardware_accounts` user trait uses (see
 * `app/scripts/services/user-traits-service.ts`), which keeps the per-event
 * property consistent with the trait.
 */
const KEYRING_TYPE_TO_METRIC_DEVICE_TYPE: Partial<
  Record<KeyringTypes, MetaMetricsHardwareWalletDeviceType>
> = {
  [KeyringTypes.ledger]: MetaMetricsHardwareWalletDeviceType.Ledger,
  [KeyringTypes.trezor]: MetaMetricsHardwareWalletDeviceType.Trezor,
  [KeyringTypes.lattice]: MetaMetricsHardwareWalletDeviceType.Lattice,
  [KeyringTypes.qr]: MetaMetricsHardwareWalletDeviceType.QrHardware,
  [KeyringTypes.oneKey]: MetaMetricsHardwareWalletDeviceType.QrHardware,
};

/**
 * The values the Segment schema declares for `account_type`:
 * `metamask | imported | snap | Ledger | Trezor | QR Hardware | Lattice`.
 *
 * {@link MetaMetricsEventAccountType.Hardware} (`'hardware'`) is excluded
 * because the schema does not declare it — hardware accounts report their
 * device name instead. Older events elsewhere in the codebase still send
 * `'hardware'`; this type makes doing so here a compile error.
 */
type SchemaAccountType =
  | Exclude<MetaMetricsEventAccountType, MetaMetricsEventAccountType.Hardware>
  | MetaMetricsHardwareWalletDeviceType;

/**
 * Segment properties describing an account's provenance, shared by the
 * `Account Hidden` and `Account Removed` events. Keys are the wire names, and
 * the value types mirror
 * `segment-schema/libraries/properties/metamask-account-types.yaml`.
 *
 * `account_type` is required by the schema, so it always resolves to a value.
 * The optional keys are left `undefined` when they do not apply — the event
 * builder strips undefined properties, so they are omitted rather than sent
 * as null.
 */
export type AccountWalletMetricProps = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  account_type: SchemaAccountType;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  account_hardware_type?: MetaMetricsHardwareWalletDeviceType;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  account_snap_type?: string;
};

/**
 * Builds the Segment account-provenance properties for a wallet from the
 * account tree, so every account management event reports `account_type` with
 * a value the schema actually declares.
 *
 * Note that `AccountWalletType` values (`entropy`/`keyring`/`snap`) are *not*
 * valid `account_type` values and must not be passed through directly.
 *
 * `account_import_type` is deliberately not reported: a
 * {@link KeyringTypes.simple} wallet cannot tell a `private_key` import from a
 * `json` one after the fact, so any value would be a guess.
 *
 * @param wallet - Wallet object from the account tree, if it is still present.
 * @returns Properties to spread into an account management event.
 */
export function getAccountWalletMetricProps(
  wallet?: AccountWalletObject,
): AccountWalletMetricProps {
  switch (wallet?.type) {
    case AccountWalletType.Snap:
      return {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Snap,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_type: wallet.metadata.snap.id,
      };

    case AccountWalletType.Keyring: {
      const keyringType = wallet.metadata.keyring.type;

      if (keyringType === KeyringTypes.simple) {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return { account_type: MetaMetricsEventAccountType.Imported };
      }

      const deviceType = KEYRING_TYPE_TO_METRIC_DEVICE_TYPE[keyringType];
      if (deviceType) {
        // The schema describes `account_type` as matching `account_hardware_type`
        // for hardware wallets, so both carry the device name.
        return {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: deviceType,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_hardware_type: deviceType,
        };
      }

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      return { account_type: MetaMetricsEventAccountType.Default };
    }

    // Entropy wallets, and anything we can no longer resolve, are MetaMask's
    // own accounts.
    default:
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      return { account_type: MetaMetricsEventAccountType.Default };
  }
}
