import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getSnapKeyringV2BuilderMessenger,
  getSnapKeyringV2BuilderInitMessenger,
  SnapKeyringV2BuilderMessenger,
  SnapKeyringV2BuilderInitMessenger,
} from '../messengers/accounts';
import { getRootMessenger } from '../../lib/messenger';
import { snapKeyringV2Builder } from '../../lib/snap-keyring/snap-keyring-v2';
import { SnapKeyringV2BuilderInit } from './snap-keyring-builder-v2-init';

jest.mock('../../lib/snap-keyring/snap-keyring-v2');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    SnapKeyringV2BuilderMessenger,
    SnapKeyringV2BuilderInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapKeyringV2BuilderMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getSnapKeyringV2BuilderInitMessenger(
      baseControllerMessenger,
    ),
    removeAccount: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SnapKeyringV2BuilderInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with correct properties', () => {
    const requestMock = buildInitRequestMock();
    const result = SnapKeyringV2BuilderInit(requestMock);

    expect(snapKeyringV2Builder).toHaveBeenCalledWith(
      requestMock.controllerMessenger,
      {
        persistKeyringHelper: expect.any(Function),
        removeAccountHelper: expect.any(Function),
        trackEvent: expect.any(Function),
      },
    );
    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
  });

  it('persistKeyringHelper persists keyrings and updates accounts', async () => {
    const requestMock = buildInitRequestMock();
    const initMessengerCallSpy = jest
      .spyOn(requestMock.initMessenger, 'call')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue(undefined as any);

    SnapKeyringV2BuilderInit(requestMock);

    const { persistKeyringHelper } =
      jest.mocked(snapKeyringV2Builder).mock.calls[0][1];
    await persistKeyringHelper();

    expect(initMessengerCallSpy).toHaveBeenCalledWith(
      'KeyringController:persistAllKeyrings',
    );
    expect(initMessengerCallSpy).toHaveBeenCalledWith(
      'AccountsController:updateAccounts',
    );
  });

  it('removeAccountHelper delegates to the request removeAccount callback', async () => {
    const requestMock = buildInitRequestMock();
    SnapKeyringV2BuilderInit(requestMock);

    const { removeAccountHelper } =
      jest.mocked(snapKeyringV2Builder).mock.calls[0][1];
    const address = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';
    await removeAccountHelper(address);

    expect(requestMock.removeAccount).toHaveBeenCalledWith(address);
  });

  it('trackEvent forwards to MetaMetricsController:trackEvent', () => {
    const requestMock = buildInitRequestMock();
    const initMessengerCallSpy = jest
      .spyOn(requestMock.initMessenger, 'call')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue(undefined as any);

    SnapKeyringV2BuilderInit(requestMock);

    const { trackEvent } = jest.mocked(snapKeyringV2Builder).mock.calls[0][1];
    const event = { event: 'foo', category: 'Accounts' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trackEvent(event as any);

    expect(initMessengerCallSpy).toHaveBeenCalledWith(
      'MetaMetricsController:trackEvent',
      event,
    );
  });
});
