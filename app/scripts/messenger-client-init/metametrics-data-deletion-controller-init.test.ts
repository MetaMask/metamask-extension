import {
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionControllerMessenger,
} from '../controllers/metametrics-data-deletion/metametrics-data-deletion';
import { DataDeletionService } from '../services/data-deletion-service';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getMetaMetricsDataDeletionControllerMessenger } from './messengers';
import { MetaMetricsDataDeletionControllerInit } from './metametrics-data-deletion-controller-init';
import { getDataDeletionServiceMessenger } from './messengers/data-deletion-service-messenger';

jest.mock('../controllers/metametrics-data-deletion/metametrics-data-deletion');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MetaMetricsDataDeletionControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getMetaMetricsDataDeletionControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  requestMock.getMessengerClient.mockImplementation(
    // @ts-expect-error: Partial implementation.
    (controllerName: string) => {
      if (controllerName === 'DataDeletionService') {
        return new DataDeletionService({
          messenger: getDataDeletionServiceMessenger(baseMessenger),
        });
      }
    },
  );

  return requestMock;
}

describe('MetaMetricsDataDeletionControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      MetaMetricsDataDeletionControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(MetaMetricsDataDeletionController);
  });

  it('passes the proper arguments to the controller', () => {
    MetaMetricsDataDeletionControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(MetaMetricsDataDeletionController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      dataDeletionService: expect.any(DataDeletionService),
    });
  });
});
