import { SubjectMetadataController } from '@metamask/permission-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getSubjectMetadataControllerMessenger,
  SubjectMetadataControllerMessenger,
} from './messengers';
import { SubjectMetadataControllerInit } from './subject-metadata-controller-init';

jest.mock('@metamask/permission-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SubjectMetadataControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSubjectMetadataControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SubjectMetadataControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      SubjectMetadataControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SubjectMetadataController);
  });

  it('passes the proper arguments to the controller', () => {
    SubjectMetadataControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SubjectMetadataController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      subjectCacheLimit: 100,
    });
  });
});
