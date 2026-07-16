import {
  keyringBuilderFactory,
  type KeyringV2Builder,
} from '@metamask/keyring-controller';
import { QrKeyring, QrKeyringScannerBridge } from '@metamask/eth-qr-keyring';
import { QrKeyring as QrKeyringV2 } from '@metamask/eth-qr-keyring/v2';
import { KeyringClass } from '@metamask/keyring-utils';
import LatticeKeyring from 'eth-lattice-keyring';
import { OneKeyKeyring, TrezorKeyring } from '@metamask/eth-trezor-keyring';
import {
  OneKeyKeyring as OneKeyKeyringV2,
  TrezorKeyring as TrezorKeyringV2,
} from '@metamask/eth-trezor-keyring/v2';
import {
  LedgerIframeBridge,
  LedgerKeyring,
} from '@metamask/eth-ledger-bridge-keyring';
import { LedgerKeyring as LedgerKeyringV2 } from '@metamask/eth-ledger-bridge-keyring/v2';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { qrKeyringBuilderFactory } from '../lib/qr-keyring-builder-factory';
import { TrezorOffscreenBridge } from '../lib/offscreen-bridge/trezor-offscreen-bridge';
import { TrezorMv2Bridge } from '../lib/offscreen-bridge/trezor-mv2-bridge';
import { LedgerOffscreenBridge } from '../lib/offscreen-bridge/ledger-offscreen-bridge';
import { LatticeKeyringOffscreen } from '../lib/offscreen-bridge/lattice-offscreen-keyring';
import { LatticeKeyringV2 } from '../lib/offscreen-bridge/lattice-keyring-v2';
import { hardwareKeyringBuilderFactory } from '../lib/hardware-keyring-builder-factory';
import { snapKeyringBuilder } from '../lib/snap-keyring';
import {
  RootMessenger,
  RootMessengerActions,
  RootMessengerEvents,
} from '../lib/messenger';
import { getSnapKeyringBuilderMessenger } from '../messenger-client-init/messengers/accounts/snap-keyring-builder-messenger';
import {
  getSnapKeyringV2BuilderMessenger,
  snapKeyringV2AdaptedAsV1Builder,
  snapKeyringV2Builder,
} from '../lib/snap-keyring/snap-keyring-v2';

/**
 * Constructor signature shared by every V2 hardware-keyring wrapper.
 *
 * Each wrapper (`LatticeKeyringV2`, `LedgerKeyringV2`, etc.) takes a
 * `{ legacyKeyring, entropySource }` options object. The `Legacy` type
 * parameter is inferred from each wrapper's declared `legacyKeyring`
 * parameter at the call site, so the cast inside the factory targets
 * the precise legacy keyring class instead of `never`.
 */
type HardwareKeyringV2WrapperConstructor<Wrapper, Legacy> = new (options: {
  legacyKeyring: Legacy;
  entropySource: string;
}) => Wrapper;

/**
 * Wrap a hardware-keyring V2 class as a `KeyringV2Builder` keyed by the
 * matching legacy keyring's `type` string. The five hardware V2 builders
 * are mechanically identical apart from the wrapper class and the type
 * marker; this factory keeps them in lockstep instead of repeating the
 * `Object.assign` boilerplate per device.
 *
 * @param WrapperCtor - The V2 wrapper class to instantiate.
 * @param legacyType - The matching legacy keyring's `type` string. The
 * controller dispatches V2 builders by matching against the inner
 * keyring's `type`, so this must equal `LegacyKeyring.type`.
 * @returns A `KeyringV2Builder` ready for `keyringV2Builders`.
 */
function buildHardwareV2Builder<Wrapper, Legacy>(
  WrapperCtor: HardwareKeyringV2WrapperConstructor<Wrapper, Legacy>,
  legacyType: string,
): KeyringV2Builder {
  const builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new WrapperCtor({
        legacyKeyring: keyring as Legacy,
        entropySource: metadata.id,
      }),
    { type: legacyType },
  );
  // `KeyringV2Builder` declares parameter types (`Keyring`, `KeyringMetadata`)
  // and return type (`KeyringV2`) from `@metamask/keyring-controller` that
  // each wrapper satisfies structurally at runtime; this single boundary
  // cast keeps callers free of repeated assertions.
  return builder as unknown as KeyringV2Builder;
}

/**
 * Build the list of V2 keyring builders for the hardware wallets and Snaps.
 *
 * Each builder wraps the legacy hardware keyring (created by
 * `getKeyringBuilders`) in its V2 wrapper, keyed by the legacy keyring's
 * `type` so the controller can resolve it via `withKeyringV2`. Unlike the
 * legacy builders, the V2 wrappers are identical across MV2 and MV3 because
 * `LatticeKeyringOffscreen.type` mirrors `LatticeKeyring.type`.
 *
 * @returns The V2 keyring builders to register with the `KeyringController`.
 */
export function getKeyringV2Builders(): KeyringV2Builder[] {
  return [
    buildHardwareV2Builder(LatticeKeyringV2, LatticeKeyring.type),
    buildHardwareV2Builder(LedgerKeyringV2, LedgerKeyring.type),
    buildHardwareV2Builder(QrKeyringV2, QrKeyring.type),
    buildHardwareV2Builder(TrezorKeyringV2, TrezorKeyring.type),
    buildHardwareV2Builder(OneKeyKeyringV2, OneKeyKeyring.type),
    // The v2 Snap keyring is registered via `SnapKeyringV1Adapter`, which owns the
    // inner `SnapKeyring` (v2) instance and exposes a proper v1-compatible face for
    // KeyringController vault management. The same inner instance is retrieved via
    // `unwrap()` below so both v1 and v2 entries share the same underlying object —
    // enabling both `withKeyring` (and v1-interface) and `withKeyringV2`.
    snapKeyringV2Builder(),
  ];
}

/**
 * Build the list of keyring builders for the hardware wallets.
 *
 * @param messenger - The root messenger.
 * @returns The keyring builders to register with the `KeyringController`.
 */
export function getKeyringBuilders(
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
) {
  const overrides = process.env.IN_TEST
    ? {
        // Use `require` (not `import`) so this test-only code is dead-code-eliminated from production builds.
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
        trezorBridge: require('../../../test/stub/keyring-bridge')
          .FakeTrezorBridge,
        // Use `require` (not `import`) so this test-only code is dead-code-eliminated from production builds.
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
        ledgerBridge: require('../../../test/stub/keyring-bridge')
          .FakeLedgerBridge,
        // Use `require` (not `import`) so this test-only code is dead-code-eliminated from production builds.
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
        qrBridge: require('../../../test/stub/keyring-bridge').FakeQrBridge,
      }
    : {};

  const keyrings = [
    qrKeyringBuilderFactory(
      QrKeyring as unknown as KeyringClass,
      overrides?.qrBridge || QrKeyringScannerBridge,
      {
        requestScan: async (request) =>
          messenger.call('AppStateController:requestQrCodeScan', request),
      },
    ),
  ];

  if (isManifestV3 === false) {
    keyrings.push(
      keyringBuilderFactory(LatticeKeyring as unknown as KeyringClass),
      hardwareKeyringBuilderFactory(
        TrezorKeyring as unknown as KeyringClass,
        overrides?.trezorBridge || TrezorMv2Bridge,
      ),
      hardwareKeyringBuilderFactory(
        OneKeyKeyring as unknown as KeyringClass,
        TrezorMv2Bridge,
      ),
      hardwareKeyringBuilderFactory(
        LedgerKeyring as unknown as KeyringClass,
        overrides?.ledgerBridge || LedgerIframeBridge,
      ),
    );
  } else {
    keyrings.push(
      hardwareKeyringBuilderFactory(
        TrezorKeyring as unknown as KeyringClass,
        overrides?.trezorBridge || TrezorOffscreenBridge,
      ),
      hardwareKeyringBuilderFactory(
        OneKeyKeyring as unknown as KeyringClass,
        TrezorOffscreenBridge,
      ),
      hardwareKeyringBuilderFactory(
        LedgerKeyring as unknown as KeyringClass,
        overrides?.ledgerBridge || LedgerOffscreenBridge,
      ),
      keyringBuilderFactory(LatticeKeyringOffscreen as unknown as KeyringClass),
    );
  }

  // @ts-expect-error: `addAccounts` is missing in `SnapKeyring` type.
  keyrings.push(snapKeyringBuilder(getSnapKeyringBuilderMessenger(messenger)));

  // The v2 Snap keyring is registered via `SnapKeyringV1Adapter`, which owns the
  // inner `SnapKeyring` (v2) instance and exposes a proper v1-compatible face for
  // KeyringController vault management. The same inner instance is retrieved via
  // `unwrap()` below so both v1 and v2 entries share the same underlying object —
  // enabling both `withKeyring` (and v1-interface) and `withKeyringV2`.
  keyrings.push(
    snapKeyringV2AdaptedAsV1Builder(
      getSnapKeyringV2BuilderMessenger(messenger),
    ),
  );

  return keyrings;
}
