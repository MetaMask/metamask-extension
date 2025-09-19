import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getSnapKeyringMessenger,
  getSnapKeyringInitMessenger,
  SnapKeyringMessenger,
  SnapKeyringInitMessenger,
} from '../messengers/accounts';
import { SnapKeyringImpl } from '../../lib/snap-keyring/snap-keyring';
import { SnapKeyringInit } from './snap-keyring-init';

jest.mock('@metamask/eth-snap-keyring');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapKeyringMessenger, SnapKeyringInitMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapKeyringMessenger(baseControllerMessenger),
    initMessenger: getSnapKeyringInitMessenger(baseControllerMessenger),
  };
}

describe('SnapKeyringInit', () => {
  const SnapKeyringClassMock = jest.mocked(SnapKeyring);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(SnapKeyringInit(requestMock).controller).toBeInstanceOf(SnapKeyring);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    SnapKeyringInit(requestMock);

    expect(SnapKeyringClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      callbacks: expect.any(SnapKeyringImpl),
      isAnyAccountTypeAllowed: true,
    });
  });
});
