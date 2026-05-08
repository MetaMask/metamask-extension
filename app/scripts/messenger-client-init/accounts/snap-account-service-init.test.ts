import { SnapAccountService } from '@metamask/snap-account-service';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getSnapAccountServiceMessenger,
  SnapAccountServiceMessenger,
} from '../messengers/accounts';
import { getRootMessenger } from '../../lib/messenger';
import { SnapAccountServiceInit } from './snap-account-service-init';

jest.mock('@metamask/snap-account-service');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SnapAccountServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapAccountServiceMessenger(
      baseControllerMessenger,
    ),
    // `MessengerClientInitRequest<X>` requires `initMessenger`, but
    // `SnapAccountServiceInit` is typed with `InitMessengerType = void` and
    // never reads it.
    initMessenger: undefined as unknown as void,
  };
}

describe('SnapAccountServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('constructs a SnapAccountService with the controller messenger and ensureOnboardingComplete', () => {
    const requestMock = buildInitRequestMock();

    SnapAccountServiceInit(requestMock);

    expect(SnapAccountService).toHaveBeenCalledTimes(1);
    expect(SnapAccountService).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      ensureOnboardingComplete: requestMock.ensureOnboardingComplete,
    });
  });

  it('returns the constructed service as the messenger client with no persisted/mem state keys', () => {
    const requestMock = buildInitRequestMock();

    const result = SnapAccountServiceInit(requestMock);

    const constructed = jest.mocked(SnapAccountService).mock.instances[0];
    expect(result.messengerClient).toBe(constructed);
    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
  });
});
