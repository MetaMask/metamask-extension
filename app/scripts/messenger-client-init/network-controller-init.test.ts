import { ControllerStateChangeEvent } from '@metamask/base-controller';
import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  NetworkController,
  NetworkControllerMessenger,
} from '@metamask/network-controller';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  NetworkControllerInitMessenger,
  getNetworkControllerMessenger,
  getNetworkControllerInitMessenger,
} from './messengers';
import { NetworkControllerInit } from './network-controller-init';

jest.mock('@metamask/network-controller', () => {
  const originalModule = jest.requireActual('@metamask/network-controller');
  const NetworkControllerMock = jest.fn().mockImplementation(() => {
    return {
      init: jest.fn(),
      enableRpcFailover: jest.fn(),
      disableRpcFailover: jest.fn(),
    };
  });

  return {
    ...originalModule,
    NetworkController: NetworkControllerMock,
  };
});

function getInitRequestMock(
  messenger = new Messenger<MockAnyNamespace, ActionConstraint>({
    namespace: MOCK_ANY_NAMESPACE,
  }),
): jest.Mocked<
  MessengerClientInitRequest<
    NetworkControllerMessenger,
    NetworkControllerInitMessenger
  >
> {
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNetworkControllerMessenger(messenger),
    initMessenger: getNetworkControllerInitMessenger(messenger),
  };

  return requestMock;
}

describe('NetworkControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = NetworkControllerInit(getInitRequestMock());
    expect(messengerClient).toStrictEqual({
      init: expect.any(Function),
      enableRpcFailover: expect.any(Function),
      disableRpcFailover: expect.any(Function),
    });
  });

  it('passes the proper arguments to the controller', () => {
    NetworkControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      infuraProjectId: undefined,
      failoverUrls: {
        '0x1': [],
        '0xe708': [],
        '0xa4b1': [],
        '0xa86a': [],
        '0xa': [],
        '0x89': [],
        '0x2105': [],
        '0x531': [],
        '0x8f': [],
        '0x3e7': [],
        '0x13b2': [],
      },
    });
  });
});
