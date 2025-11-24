import {
  keyringBuilderFactory,
  KeyringController,
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
import { hardwareKeyringBuilderFactory } from '../lib/hardware-keyring-builder-factory';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import { qrKeyringBuilderFactory } from '../lib/qr-keyring-builder-factory';
import { encryptorFactory } from '../lib/encryptor-factory';
import { TrezorOffscreenBridge } from '../lib/offscreen-bridge/trezor-offscreen-bridge';
import { LedgerOffscreenBridge } from '../lib/offscreen-bridge/ledger-offscreen-bridge';
import { LatticeKeyringOffscreen } from '../lib/offscreen-bridge/lattice-offscreen-keyring';
import { ControllerInitFunction } from './types';
import {
  KeyringControllerMessenger,
  KeyringControllerInitMessenger,
} from './messengers';

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

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const snapKeyringBuilder = getController('SnapKeyringBuilder');

  // @ts-expect-error: `addAccounts` is missing in `SnapKeyring` type.
  additionalKeyrings.push(snapKeyringBuilder);
  ///: END:ONLY_INCLUDE_IF

  // @ts-expect-error: The types for the encryptor are not correct.
  const controller = new KeyringController({
    state: persistedState.KeyringController,
    messenger: controllerMessenger,
    cacheEncryptionKey: true,
    keyringBuilders: additionalKeyrings,
    encryptor: encryptor || encryptorFactory(600_000),
  });

  return {
    controller,
  };
};
