import {
  SnapRegistryController,
  SnapRegistryControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getSnapRegistryControllerMessenger } from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { SnapRegistryControllerInit } from './snap-registry-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SnapRegistryControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapRegistryControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SnapRegistryControllerInit', () => {
  const metamaskVersion = process.env.METAMASK_VERSION;
  beforeAll(() => {
    process.env.METAMASK_VERSION = '13.9.0-flask.0';
  });

  afterAll(() => {
    process.env.METAMASK_VERSION = metamaskVersion;
  });

  it('initializes the controller', () => {
    const { messengerClient } =
      SnapRegistryControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SnapRegistryController);
  });

  it('passes the proper arguments to the controller', () => {
    SnapRegistryControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapRegistryController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      refetchOnAllowlistMiss: false,
      clientConfig: {
        type: 'extension',
        version: '13.9.0',
      },
    });
  });
});
