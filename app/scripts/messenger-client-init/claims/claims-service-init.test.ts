import {
  ClaimsService,
  ClaimsServiceMessenger,
} from '@metamask/claims-controller';
import { getRootMessenger } from '../../lib/messenger';
import { getClaimsServiceMessenger } from '../messengers/claims/claims-service-messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import { ClaimsServiceInit } from './claims-service-init';

jest.mock('@metamask/claims-controller');

function buildInitRequestMock() {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getClaimsServiceMessenger(baseControllerMessenger),
    initMessenger: undefined,
  } as unknown as jest.Mocked<
    MessengerClientInitRequest<ClaimsServiceMessenger>
  >;
}

describe('ClaimsServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return Service instance', () => {
    const requestMock = buildInitRequestMock();
    expect(ClaimsServiceInit(requestMock).messengerClient).toBeInstanceOf(
      ClaimsService,
    );
  });
});
