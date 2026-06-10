import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getSnapKeyringV2BuilderMessenger,
  SnapKeyringV2BuilderMessenger,
} from '../messengers/accounts';
import { getRootMessenger } from '../../lib/messenger';
import { snapKeyringV2Builder } from '../../lib/snap-keyring/snap-keyring-v2';
import { SnapKeyringV2BuilderInit } from './snap-keyring-builder-v2-init';

jest.mock('../../lib/snap-keyring/snap-keyring-v2');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SnapKeyringV2BuilderMessenger>
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapKeyringV2BuilderMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('SnapKeyringV2BuilderInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with correct properties', () => {
    const requestMock = buildInitRequestMock();
    const result = SnapKeyringV2BuilderInit(requestMock);

    expect(snapKeyringV2Builder).toHaveBeenCalledWith();
    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
  });
});
