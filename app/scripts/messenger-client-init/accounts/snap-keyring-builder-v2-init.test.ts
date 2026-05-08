import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getSnapKeyringBuilderV2Messenger,
  getSnapKeyringBuilderV2InitMessenger,
  SnapKeyringBuilderV2Messenger,
  SnapKeyringBuilderV2InitMessenger,
} from '../messengers/accounts';
import { getRootMessenger } from '../../lib/messenger';
import { snapKeyringBuilderV2 } from '../../lib/snap-keyring/snap-keyring-v2';
import { SnapKeyringBuilderV2Init } from './snap-keyring-builder-v2-init';

jest.mock('../../lib/snap-keyring/snap-keyring-v2');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    SnapKeyringBuilderV2Messenger,
    SnapKeyringBuilderV2InitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapKeyringBuilderV2Messenger(
      baseControllerMessenger,
    ),
    initMessenger: getSnapKeyringBuilderV2InitMessenger(
      baseControllerMessenger,
    ),
    removeAccount: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SnapKeyringBuilderV2Init', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with correct properties', () => {
    const requestMock = buildInitRequestMock();
    const result = SnapKeyringBuilderV2Init(requestMock);

    expect(snapKeyringBuilderV2).toHaveBeenCalledWith(
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

    SnapKeyringBuilderV2Init(requestMock);

    const { persistKeyringHelper } = jest.mocked(snapKeyringBuilderV2).mock
      .calls[0][1];
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
    SnapKeyringBuilderV2Init(requestMock);

    const { removeAccountHelper } = jest.mocked(snapKeyringBuilderV2).mock
      .calls[0][1];
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

    SnapKeyringBuilderV2Init(requestMock);

    const { trackEvent } = jest.mocked(snapKeyringBuilderV2).mock.calls[0][1];
    const event = { event: 'foo', category: 'Accounts' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trackEvent(event as any);

    expect(initMessengerCallSpy).toHaveBeenCalledWith(
      'MetaMetricsController:trackEvent',
      event,
    );
  });
});
