import { Messenger } from '@metamask/base-controller';
import { BridgeController } from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getBridgeControllerMessenger,
  BridgeControllerMessenger,
  getBridgeControllerInitMessenger,
  BridgeControllerInitMessenger,
} from './messengers';
import { BridgeControllerInit } from './bridge-controller-init';

jest.mock('@metamask/bridge-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    BridgeControllerMessenger,
    BridgeControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBridgeControllerMessenger(baseMessenger),
    initMessenger: getBridgeControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('BridgeControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = BridgeControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BridgeController);
  });

  it('passes the proper arguments to the controller', () => {
    BridgeControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      clientId: 'extension',
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      fetchFn: expect.any(Function),
      getLayer1GasFee: expect.any(Function),
      trackMetaMetricsFn: expect.any(Function),
      traceFn: expect.any(Function),
    });
  });
});
