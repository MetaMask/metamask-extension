import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getSnapKeyringBuilderMessenger,
  getSnapKeyringBuilderInitMessenger,
  SnapKeyringBuilderMessenger,
  SnapKeyringBuilderInitMessenger,
} from '../messengers/accounts';
import { snapKeyringBuilder } from '../../lib/snap-keyring';
import { SnapKeyringBuilderInit } from './snap-keyring-builder-init';

jest.mock('../../lib/snap-keyring/snap-keyring');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    SnapKeyringBuilderMessenger,
    SnapKeyringBuilderInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapKeyringBuilderMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getSnapKeyringBuilderInitMessenger(baseControllerMessenger),
  };
}

describe('SnapKeyringBuilderInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with correct properties', () => {
    const requestMock = buildInitRequestMock();
    SnapKeyringBuilderInit(requestMock);

    expect(snapKeyringBuilder).toHaveBeenCalledWith(
      requestMock.controllerMessenger,
      {
        persistKeyringHelper: expect.any(Function),
        removeAccountHelper: expect.any(Function),
        trackEvent: expect.any(Function),
      },
    );
  });
});
