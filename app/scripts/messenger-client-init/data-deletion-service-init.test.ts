import { getRootMessenger } from '../lib/messenger';
import {
  DataDeletionService,
  DataDeletionServiceMessenger,
} from '../services/data-deletion-service';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { DataDeletionServiceInit } from './data-deletion-service-init';
import { getDataDeletionServiceMessenger } from './messengers/data-deletion-service-messenger';

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<DataDeletionServiceMessenger>
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

    expect(DataDeletionServiceInit(requestMock).messengerClient).toBeInstanceOf(
      DataDeletionService,
    );
  });
});
