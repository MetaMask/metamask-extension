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
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { snapKeyringBuilder } from '../lib/snap-keyring';
///: END:ONLY_INCLUDE_IF
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
 * @param request.persistedState
 * @param request.initMessenger
 * @param request.keyringOverrides
 * @param request.encryptor
 * @param request.removeAccount
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
  removeAccount,
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
  const persistAndUpdateAccounts = async () => {
    await initMessenger.call('KeyringController:persistAllKeyrings');
    await initMessenger.call('AccountsController:updateAccounts');
  };

  additionalKeyrings.push(
    // @ts-expect-error: `SnapKeyring` seems to be missing `addAccount`.
    snapKeyringBuilder(initMessenger, {
      persistKeyringHelper: () => persistAndUpdateAccounts(),
      removeAccountHelper: (address) => removeAccount(address),
      trackEvent: initMessenger.call.bind(
        initMessenger,
        'MetaMetricsController:trackEvent',
      ),
    }),
  );
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
