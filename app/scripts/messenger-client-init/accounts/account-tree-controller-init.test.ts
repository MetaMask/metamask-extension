import {
  AccountTreeController,
  AccountTreeControllerMessenger,
} from '@metamask/account-tree-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getAccountTreeControllerMessenger,
  getAccountTreeControllerInitMessenger,
  AccountTreeControllerInitMessenger,
} from '../messengers/accounts';
import { getRootMessenger } from '../../lib/messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { trackLegacyMetaMetricsEvent } from '../../controllers/analytics';
import { AccountTreeControllerInit } from './account-tree-controller-init';

jest.mock('@metamask/account-tree-controller');
jest.mock('../../controllers/analytics', () => ({
  trackLegacyMetaMetricsEvent: jest.fn(),
}));

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    AccountTreeControllerMessenger,
    AccountTreeControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountTreeControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getAccountTreeControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('AccountTreeControllerInit', () => {
  const accountTreeControllerClassMock = jest.mocked(AccountTreeController);
  const trackLegacyMetaMetricsEventMock = jest.mocked(
    trackLegacyMetaMetricsEvent,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      AccountTreeControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(AccountTreeController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AccountTreeControllerInit(requestMock);

    expect(accountTreeControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messenger: requestMock.controllerMessenger,
        state: requestMock.persistedState.AccountTreeController,
        config: expect.objectContaining({
          trace: expect.any(Function),
          backupAndSync: expect.objectContaining({
            onBackupAndSyncEvent: expect.any(Function),
          }),
        }),
      }),
    );
  });

  it('routes backup and sync events through AnalyticsController', () => {
    const requestMock = buildInitRequestMock();
    AccountTreeControllerInit(requestMock);

    const { config } = accountTreeControllerClassMock.mock.calls[0][0];
    config?.backupAndSync?.onBackupAndSyncEvent?.({
      // @ts-expect-error test payload
      // eslint-disable-next-line @typescript-eslint/naming-convention
      profile_id: 'profile-1',
    });

    expect(trackLegacyMetaMetricsEventMock).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.BackupAndSync,
      event: MetaMetricsEventName.ProfileActivityUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        profile_id: 'profile-1',
      },
    });
  });
});
