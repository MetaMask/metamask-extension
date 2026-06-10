import { keyringBuilderFactory } from '@metamask/keyring-controller';
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
import { Messenger } from '@metamask/messenger';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { qrKeyringBuilderFactory } from '../lib/qr-keyring-builder-factory';
import { TrezorOffscreenBridge } from '../lib/offscreen-bridge/trezor-offscreen-bridge';
import { LedgerOffscreenBridge } from '../lib/offscreen-bridge/ledger-offscreen-bridge';
import { LatticeKeyringOffscreen } from '../lib/offscreen-bridge/lattice-offscreen-keyring';
import { hardwareKeyringBuilderFactory } from '../lib/hardware-keyring-builder-factory';
import { snapKeyringBuilder } from '../lib/snap-keyring';
import {
  RootMessenger,
  RootMessengerActions,
  RootMessengerEvents,
} from '../lib/messenger';
import { SnapKeyringBuilderMessenger } from '../lib/snap-keyring/types';

export function getKeyringBuilders(
  messenger: RootMessenger<RootMessengerActions, RootMessengerEvents>,
) {
  const overrides = process.env.IN_TEST
    ? {
        // Use `require` to make it easier to exclude this test code from the Browserify build.
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
        trezorBridge: require('../../../test/stub/keyring-bridge')
          .FakeTrezorBridge,
        // Use `require` to make it easier to exclude this test code from the Browserify build.
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
        ledgerBridge: require('../../../test/stub/keyring-bridge')
          .FakeLedgerBridge,
        // Use `require` to make it easier to exclude this test code from the Browserify build.
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
        overrides?.trezorBridge || TrezorConnectBridge,
      ),
      hardwareKeyringBuilderFactory(
        OneKeyKeyring as unknown as KeyringClass,
        TrezorConnectBridge,
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

  const snapKeyringMessenger: SnapKeyringBuilderMessenger = new Messenger({
    namespace: 'SnapKeyring',
    parent: messenger,
  });

  messenger.delegate({
    messenger: snapKeyringMessenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'ApprovalController:startFlow',
      'ApprovalController:endFlow',
      'ApprovalController:showSuccess',
      'ApprovalController:showError',
      'PhishingController:testOrigin',
      'PhishingController:maybeUpdateState',
      'KeyringController:getAccounts',
      'KeyringController:persistAllKeyrings',
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'AccountsController:listMultichainAccounts',
      'AccountsController:updateAccounts',
      'SnapController:handleRequest',
      'SnapController:getSnap',
      'SnapController:isMinimumPlatformVersion',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:trackEvent',
      'LegacyBackgroundApiService:removeAccount',
    ],
  });

  // @ts-expect-error: `addAccounts` is missing in `SnapKeyring` type.
  keyrings.push(snapKeyringBuilder(snapKeyringMessenger));

  return keyrings;
}
