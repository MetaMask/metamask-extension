import { Messenger } from '@metamask/base-controller';
import MetaMetricsController from '../controllers/metametrics-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getMetaMetricsControllerMessenger,
  MetaMetricsControllerMessenger,
} from './messengers';
import { MetaMetricsControllerInit } from './metametrics-controller-init';

jest.mock('../controllers/metametrics-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MetaMetricsControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMetaMetricsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('MetaMetricsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = MetaMetricsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(MetaMetricsController);
  });

  it('passes the proper arguments to the controller', () => {
    MetaMetricsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(MetaMetricsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      captureException: expect.any(Function),
      environment: 'test',
      extension: expect.any(Object),
      segment: expect.any(Object),
      version: 'MOCK_VERSION',
    });
  });
});
