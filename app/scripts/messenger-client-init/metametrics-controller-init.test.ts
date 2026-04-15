import {
  MetaMetricsController,
  MetaMetricsControllerMessenger,
} from '../controllers/metametrics-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getMetaMetricsControllerMessenger } from './messengers';
import { MetaMetricsControllerInit } from './metametrics-controller-init';

jest.mock('../controllers/metametrics-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MetaMetricsControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMetaMetricsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('MetaMetricsControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = MetaMetricsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(MetaMetricsController);
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
