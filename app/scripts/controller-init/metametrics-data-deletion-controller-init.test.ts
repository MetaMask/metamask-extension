import { Messenger } from '@metamask/base-controller';
import { MetaMetricsDataDeletionController } from '../controllers/metametrics-data-deletion/metametrics-data-deletion';
import { DataDeletionService } from '../services/data-deletion-service';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getMetaMetricsDataDeletionControllerMessenger,
  MetaMetricsDataDeletionControllerMessenger,
} from './messengers';
import { MetaMetricsDataDeletionControllerInit } from './metametrics-data-deletion-controller-init';

jest.mock('../controllers/metametrics-data-deletion/metametrics-data-deletion');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MetaMetricsDataDeletionControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getMetaMetricsDataDeletionControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('MetaMetricsDataDeletionControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } =
      MetaMetricsDataDeletionControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(MetaMetricsDataDeletionController);
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
