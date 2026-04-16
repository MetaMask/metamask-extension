import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getSnapsNameProviderMessenger } from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import {
  SnapsNameProvider,
  SnapsNameProviderMessenger,
} from '../../lib/SnapsNameProvider';
import { SnapsNameProviderInit } from './snaps-name-provider-init';

jest.mock('../../lib/SnapsNameProvider');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SnapsNameProviderMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapsNameProviderMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SnapsNameProvider', () => {
  it('initializes the provider', () => {
    const { messengerClient } = SnapsNameProviderInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SnapsNameProvider);
  });
});
