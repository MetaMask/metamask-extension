import {
  keyringBuilderFactory,
  KeyringController,
  type KeyringV2Builder,
} from '@metamask/keyring-controller';
import { QrKeyring, QrKeyringScannerBridge } from '@metamask/eth-qr-keyring';
import { QrKeyring as QrKeyringV2 } from '@metamask/eth-qr-keyring/v2';
import { KeyringClass } from '@metamask/keyring-utils';
import LatticeKeyring from 'eth-lattice-keyring';
import {
  OneKeyKeyring,
  TrezorConnectBridge,
  TrezorKeyring,
} from '@metamask/eth-trezor-keyring';
import {
  OneKeyKeyring as OneKeyKeyringV2,
  TrezorKeyring as TrezorKeyringV2,
} from '@metamask/eth-trezor-keyring/v2';
import {
  LedgerIframeBridge,
  LedgerKeyring,
} from '@metamask/eth-ledger-bridge-keyring';
import { LedgerKeyring as LedgerKeyringV2 } from '@metamask/eth-ledger-bridge-keyring/v2';
import { hardwareKeyringBuilderFactory } from '../lib/hardware-keyring-builder-factory';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { qrKeyringBuilderFactory } from '../lib/qr-keyring-builder-factory';
import { encryptorFactory } from '../lib/encryptor-factory';
import { TrezorOffscreenBridge } from '../lib/offscreen-bridge/trezor-offscreen-bridge';
import { LedgerOffscreenBridge } from '../lib/offscreen-bridge/ledger-offscreen-bridge';
import { LatticeKeyringOffscreen } from '../lib/offscreen-bridge/lattice-offscreen-keyring';
import { LatticeKeyringV2 } from '../lib/offscreen-bridge/lattice-keyring-v2';
import { MessengerClientInitFunction } from './types';
import {
  KeyringControllerMessenger,
  KeyringControllerInitMessenger,
} from './messengers';

/**
 * Constructor signature shared by every V2 hardware-keyring wrapper.
 *
 * Each wrapper (`LatticeKeyringV2`, `LedgerKeyringV2`, etc.) takes a
 * `{ legacyKeyring, entropySource }` options object. Declared here so
 * `buildHardwareV2Builder` can construct any of them uniformly.
 */
type HardwareV2WrapperCtor<Wrapper> = new (options: {
  legacyKeyring: never;
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
function buildHardwareV2Builder<Wrapper>(
  WrapperCtor: HardwareV2WrapperCtor<Wrapper>,
  legacyType: string,
): KeyringV2Builder {
  const builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new WrapperCtor({
        legacyKeyring: keyring as never,
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
 * @param request.getMessengerClient - Function to get other controllers.
 * @returns The initialized controller.
 */
export const KeyringControllerInit: MessengerClientInitFunction<
  KeyringController,
  KeyringControllerMessenger,
  KeyringControllerInitMessenger
> = ({
  controllerMessenger,
  persistedState,
  initMessenger,
  keyringOverrides,
  encryptor,
  getMessengerClient,
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

  const snapKeyringBuilder = getMessengerClient('SnapKeyringBuilder');

  // @ts-expect-error: `addAccounts` is missing in `SnapKeyring` type.
  additionalKeyrings.push(snapKeyringBuilder);

  const messengerClient = new KeyringController({
    state: persistedState.KeyringController,
    messenger: controllerMessenger,
    keyringBuilders: additionalKeyrings,
    keyringV2Builders: [
      buildHardwareV2Builder(LatticeKeyringV2, LatticeKeyring.type),
      buildHardwareV2Builder(LedgerKeyringV2, LedgerKeyring.type),
      buildHardwareV2Builder(QrKeyringV2, QrKeyring.type),
      buildHardwareV2Builder(TrezorKeyringV2, TrezorKeyring.type),
      buildHardwareV2Builder(OneKeyKeyringV2, OneKeyKeyring.type),
    ],
    encryptor: encryptor || encryptorFactory(600_000),
  });

  return {
    messengerClient,
  };
};
