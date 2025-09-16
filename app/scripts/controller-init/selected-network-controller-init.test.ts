import { Messenger } from '@metamask/base-controller';
import { SelectedNetworkController } from '@metamask/selected-network-controller';
import { WeakRefObjectMap } from '../lib/WeakRefObjectMap';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getSelectedNetworkControllerMessenger,
  SelectedNetworkControllerMessenger,
} from './messengers';
import { SelectedNetworkControllerInit } from './selected-network-controller-init';

jest.mock('@metamask/selected-network-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SelectedNetworkControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSelectedNetworkControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SelectedNetworkControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = SelectedNetworkControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SelectedNetworkController);
  });

  it('passes the proper arguments to the controller', () => {
    SelectedNetworkControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SelectedNetworkController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      domainProxyMap: expect.any(WeakRefObjectMap),
      onPreferencesStateChange: expect.any(Function),
      useRequestQueuePreference: true,
    });
  });
});
