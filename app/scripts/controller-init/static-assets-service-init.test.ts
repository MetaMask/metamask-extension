import { StaticAssetsService } from '../controllers/static-assets-service';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getStaticAssetsServiceInitMessenger,
  getStaticAssetsServiceMessenger,
  StaticAssetsServiceInitMessenger,
  StaticAssetsServiceMessenger,
} from './messengers';
import { StaticAssetsServiceInit } from './static-assets-service-init';

jest.mock('../controllers/static-assets-service');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    StaticAssetsServiceMessenger,
    StaticAssetsServiceInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getStaticAssetsServiceMessenger(baseMessenger),
    initMessenger: getStaticAssetsServiceInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('StaticAssetsServiceInit', () => {
  it('initializes the controller', () => {
    const { controller } = StaticAssetsServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(StaticAssetsService);
  });

  it('passes the proper arguments to the controller', () => {
    StaticAssetsServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(StaticAssetsService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      getSupportedChains: expect.any(Function),
      fetchFn: expect.any(Function),
      getTopX: expect.any(Function),
    });
  });
});
