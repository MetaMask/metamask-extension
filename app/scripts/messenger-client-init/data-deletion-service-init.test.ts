import { ControllerInitRequest } from './types';
import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import {
  DataDeletionService,
  DataDeletionServiceMessenger,
} from '../services/data-deletion-service';
import { DataDeletionServiceInit } from './data-deletion-service-init';
import { getDataDeletionServiceMessenger } from './messengers/data-deletion-service-messenger';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<DataDeletionServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDataDeletionServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('DataDeletionServiceInit', () => {
  it('returns the service instance', () => {
    const requestMock = buildInitRequestMock();

    expect(DataDeletionServiceInit(requestMock).controller).toBeInstanceOf(
      DataDeletionService,
    );
  });
});
