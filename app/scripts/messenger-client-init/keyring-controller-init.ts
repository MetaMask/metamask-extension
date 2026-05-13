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

  const latticeKeyringV2Builder: KeyringV2Builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new LatticeKeyringV2({
        legacyKeyring: keyring as ConstructorParameters<
          typeof LatticeKeyringV2
        >[0]['legacyKeyring'],
        entropySource: metadata.id,
      }),
    { type: LatticeKeyring.type },
  );

  const ledgerKeyringV2Builder: KeyringV2Builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new LedgerKeyringV2({
        legacyKeyring: keyring as ConstructorParameters<
          typeof LedgerKeyringV2
        >[0]['legacyKeyring'],
        entropySource: metadata.id,
      }),
    { type: LedgerKeyring.type },
  );

  const qrKeyringV2Builder: KeyringV2Builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new QrKeyringV2({
        legacyKeyring: keyring as ConstructorParameters<
          typeof QrKeyringV2
        >[0]['legacyKeyring'],
        entropySource: metadata.id,
      }),
    { type: QrKeyring.type },
  );

  const trezorKeyringV2Builder: KeyringV2Builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new TrezorKeyringV2({
        legacyKeyring: keyring as ConstructorParameters<
          typeof TrezorKeyringV2
        >[0]['legacyKeyring'],
        entropySource: metadata.id,
      }),
    { type: TrezorKeyring.type },
  );

  const onekeyKeyringV2Builder: KeyringV2Builder = Object.assign(
    (keyring: unknown, metadata: { id: string }) =>
      new OneKeyKeyringV2({
        legacyKeyring: keyring as ConstructorParameters<
          typeof OneKeyKeyringV2
        >[0]['legacyKeyring'],
        entropySource: metadata.id,
      }),
    { type: OneKeyKeyring.type },
  );

  const messengerClient = new KeyringController({
    state: persistedState.KeyringController,
    messenger: controllerMessenger,
    keyringBuilders: additionalKeyrings,
    keyringV2Builders: [
      latticeKeyringV2Builder,
      ledgerKeyringV2Builder,
      qrKeyringV2Builder,
      trezorKeyringV2Builder,
      onekeyKeyringV2Builder,
    ],
    encryptor: encryptor || encryptorFactory(600_000),
  });

  return {
    messengerClient,
  };
};
