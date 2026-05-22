import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { NetworkControllerGetSelectedNetworkClientAction } from '@metamask/network-controller';
import {
  KeyringController,
  keyringBuilderFactory,
} from '@metamask/keyring-controller';
import { GridPlusKeyringMV2 } from '../lib/gridplus-keyring-mv2';
import { LatticeKeyringOffscreen } from '../lib/offscreen-bridge/lattice-offscreen-keyring';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getKeyringControllerMessenger,
  KeyringControllerMessenger,
  getKeyringControllerInitMessenger,
  KeyringControllerInitMessenger,
} from './messengers';
import { KeyringControllerInit } from './keyring-controller-init';

const mockIsManifestV3State = {
  value: true,
};

jest.mock('@metamask/keyring-controller');
jest.mock('../../../shared/lib/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3State.value;
  },
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    KeyringControllerMessenger,
    KeyringControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    MockAnyNamespace,
    NetworkControllerGetSelectedNetworkClientAction | ActionConstraint,
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

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getKeyringControllerMessenger(baseMessenger),
    initMessenger: getKeyringControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('KeyringControllerInit', () => {
  beforeEach(() => {
    mockIsManifestV3State.value = true;
    jest.clearAllMocks();
  });

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
    });
  });

  it('uses the Lattice offscreen keyring in MV3 builds', () => {
    mockIsManifestV3State.value = true;

    KeyringControllerInit(getInitRequestMock());

    expect(jest.mocked(keyringBuilderFactory)).toHaveBeenCalledWith(
      LatticeKeyringOffscreen,
    );
    expect(jest.mocked(keyringBuilderFactory)).not.toHaveBeenCalledWith(
      GridPlusKeyringMV2,
    );
  });

  it('uses the MV2 GridPlus keyring when MV3 is disabled', () => {
    mockIsManifestV3State.value = false;

    KeyringControllerInit(getInitRequestMock());

    expect(jest.mocked(keyringBuilderFactory)).toHaveBeenCalledWith(
      GridPlusKeyringMV2,
    );
    expect(jest.mocked(keyringBuilderFactory)).not.toHaveBeenCalledWith(
      LatticeKeyringOffscreen,
    );
  });
});
