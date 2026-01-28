import { StaticAssetsController } from '../controllers/static-assets-controller';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getStaticAssetsControllerInitMessenger,
  getStaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger,
  StaticAssetsControllerMessenger,
} from './messengers';
import { StaticAssetsControllerInit } from './static-assets-controller-init';

jest.mock('../controllers/static-assets-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    StaticAssetsControllerMessenger,
    StaticAssetsControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getStaticAssetsControllerMessenger(baseMessenger),
    initMessenger: getStaticAssetsControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('StaticAssetsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = StaticAssetsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(StaticAssetsController);
  });

  it('passes the proper arguments to the controller', () => {
    StaticAssetsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(StaticAssetsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      interval: 3 * 60 * 60 * 1000,
      supportedChains: expect.any(Function),
    });
  });
});
