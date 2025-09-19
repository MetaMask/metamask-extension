import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getSnapKeyringBuilderMessenger,
  getSnapKeyringBuilderInitMessenger,
  SnapKeyringBuilderMessenger,
  SnapKeyringBuilderInitMessenger,
} from '../messengers/accounts';
import { SnapKeyringImpl } from '../../lib/snap-keyring/snap-keyring';
import { SnapKeyringBuilderInit } from './snap-keyring-builder-init';

jest.mock('@metamask/eth-snap-keyring');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapKeyringBuilderMessenger, SnapKeyringBuilderInitMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapKeyringBuilderMessenger(baseControllerMessenger),
    initMessenger: getSnapKeyringBuilderInitMessenger(baseControllerMessenger),
  };
}

describe('SnapKeyringInit', () => {
  const SnapKeyringClassMock = jest.mocked(SnapKeyring);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(SnapKeyringBuilderInit(requestMock).controller).toBeInstanceOf(SnapKeyring);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    SnapKeyringBuilderInit(requestMock);

    expect(SnapKeyringClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      callbacks: expect.any(SnapKeyringImpl),
      isAnyAccountTypeAllowed: true,
    });
  });
});
