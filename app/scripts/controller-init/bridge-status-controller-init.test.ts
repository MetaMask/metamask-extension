import { Messenger } from '@metamask/base-controller';
import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getBridgeStatusControllerMessenger,
  BridgeStatusControllerMessenger,
} from './messengers';
import { BridgeStatusControllerInit } from './bridge-status-controller-init';

jest.mock('@metamask/bridge-status-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<BridgeStatusControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBridgeStatusControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('BridgeStatusControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = BridgeStatusControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BridgeStatusController);
  });

  it('passes the proper arguments to the controller', () => {
    BridgeStatusControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeStatusController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      addTransactionFn: expect.any(Function),
      addTransactionBatchFn: expect.any(Function),
      updateTransactionFn: expect.any(Function),
      estimateGasFeeFn: expect.any(Function),
      fetchFn: expect.any(Function),
      traceFn: expect.any(Function),
    });
  });
});
