import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapsNameProviderMessenger,
  SnapsNameProviderMessenger,
} from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { SnapsNameProvider } from '../../lib/SnapsNameProvider';
import { SnapsNameProviderInit } from './snaps-name-provider-init';

jest.mock('../../lib/SnapsNameProvider');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapsNameProviderMessenger>
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
    const { controller } = SnapsNameProviderInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SnapsNameProvider);
  });
});
