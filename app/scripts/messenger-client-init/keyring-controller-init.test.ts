import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { NetworkControllerGetSelectedNetworkClientAction } from '@metamask/network-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { LedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';
import { OneKeyKeyring, TrezorKeyring } from '@metamask/eth-trezor-keyring';
import { QrKeyring, QrScanRequestType } from '@metamask/eth-qr-keyring';
import LatticeKeyring from 'eth-lattice-keyring';
import { AppStateControllerRequestQrCodeScanAction } from '../controllers/app-state-controller-method-action-types';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getKeyringControllerMessenger,
  KeyringControllerMessenger,
  getKeyringControllerInitMessenger,
  KeyringControllerInitMessenger,
} from './messengers';
import { KeyringControllerInit } from './keyring-controller-init';

jest.mock('@metamask/keyring-controller');

// `isManifestV3` is read at call time inside `KeyringControllerInit`. Backing
// the mocked export with a getter lets individual tests flip the flag without
// re-importing the module under test.
let mockIsManifestV3 = false;
jest.mock('../../../shared/lib/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3;
  },
}));

function getInitRequestMock({
  qrScanHandler,
}: {
  qrScanHandler?: jest.Mock;
} = {}): jest.Mocked<
  MessengerClientInitRequest<
    KeyringControllerMessenger,
    KeyringControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    MockAnyNamespace,
    | NetworkControllerGetSelectedNetworkClientAction
    | AppStateControllerRequestQrCodeScanAction
    | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  baseMessenger.registerActionHandler(
    'NetworkController:getSelectedNetworkClient',
    () => ({
      // @ts-expect-error: Partial mock.
      provider: {},

      // @ts-expect-error: Partial mock.
      blockTracker: {},
    }),
  );

  if (qrScanHandler) {
    baseMessenger.registerActionHandler(
      'AppStateController:requestQrCodeScan',
      qrScanHandler,
    );
  }

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getKeyringControllerMessenger(baseMessenger),
    initMessenger: getKeyringControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('KeyringControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = KeyringControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(KeyringController);
  });

  it('passes the proper arguments to the controller', () => {
    KeyringControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(KeyringController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      encryptor: expect.any(Object),
      keyringBuilders: expect.any(Array),
      keyringV2Builders: expect.any(Array),
    });
  });

  it('forwards QR scan requests to the AppStateController via the init messenger', async () => {
    const qrScanHandler = jest.fn().mockResolvedValue({ scanned: true });
    const request = getInitRequestMock({ qrScanHandler });
    KeyringControllerInit(request);

    const controllerArgs = jest
      .mocked(KeyringController)
      .mock.calls.at(-1)?.[0];
    const qrBuilder = controllerArgs
      ?.keyringBuilders?.[0] as (() => QrKeyring) & {
      type: string;
    };
    expect(qrBuilder.type).toBe(QrKeyring.type);

    // Build a QR keyring via the registered builder to exercise the
    // `requestScan` closure passed into `qrKeyringBuilderFactory`'s options.
    const qrKeyring = qrBuilder();
    const scanRequest = { type: QrScanRequestType.PAIR };
    const scanResult = await qrKeyring.bridge.requestScan(scanRequest);

    expect(qrScanHandler).toHaveBeenCalledWith(scanRequest);
    expect(scanResult).toEqual({ scanned: true });
  });

  it('registers the MV3 hardware-keyring set when isManifestV3 is true', () => {
    mockIsManifestV3 = true;
    try {
      KeyringControllerInit(getInitRequestMock());

      const args = jest.mocked(KeyringController).mock.calls.at(-1)?.[0];
      const mv3Builders = (args?.keyringBuilders ?? []) as unknown[];

      // Each builder factory marks its return value with a `type` matching the
      // legacy keyring `type` constant. The Lattice offscreen builder uses
      // `@metamask/keyring-controller`'s `keyringBuilderFactory` which is
      // mocked at the top of this file (returns `undefined`); the snap
      // keyring builder is `undefined` because `getMessengerClient` is
      // unstubbed for `SnapKeyringBuilder`. Filter both before asserting.
      const types = mv3Builders
        .filter((b): b is { type: string } => Boolean(b))
        .map((b) => b.type);
      expect(types).toEqual(
        expect.arrayContaining([
          QrKeyring.type,
          TrezorKeyring.type,
          OneKeyKeyring.type,
          LedgerKeyring.type,
        ]),
      );
    } finally {
      mockIsManifestV3 = false;
    }
  });

  describe('V2 builder closures', () => {
    function invokeV2Builders() {
      KeyringControllerInit(getInitRequestMock());
      const args = jest.mocked(KeyringController).mock.calls.at(-1)?.[0];
      return args?.keyringV2Builders ?? [];
    }

    it('produces a V2 wrapper for each hardware keyring type', () => {
      const builders = invokeV2Builders() as {
        (legacy: unknown, metadata: { id: string }): unknown;
        type: string;
      }[];

      const byType = Object.fromEntries(builders.map((b) => [b.type, b]));

      // Each V2 builder constructs its wrapper around the legacy keyring
      // instance handed to it by the controller. We invoke each with a
      // minimal stub so the closures run.
      const legacyStub = { hdPath: `m/44'/60'/0'/0/x`, getAccounts: jest.fn() };
      const metadata = { id: 'entropy-source-id' };

      expect(byType[LatticeKeyring.type](legacyStub, metadata)).toBeDefined();
      expect(byType[LedgerKeyring.type](legacyStub, metadata)).toBeDefined();
      expect(byType[QrKeyring.type](legacyStub, metadata)).toBeDefined();
      expect(byType[TrezorKeyring.type](legacyStub, metadata)).toBeDefined();
      expect(byType[OneKeyKeyring.type](legacyStub, metadata)).toBeDefined();
    });
  });
});
