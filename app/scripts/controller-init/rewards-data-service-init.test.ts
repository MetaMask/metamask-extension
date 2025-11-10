import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import type { PreferencesControllerGetStateAction } from '../controllers/preferences-controller';
import { RewardsDataService } from '../controllers/rewards/rewards-data-service';
import { ControllerInitRequest } from './types';
import {
  getRewardsDataServiceMessenger,
  RewardsDataServiceMessenger,
} from './messengers/reward-data-service-messenger';
import { RewardsDataServiceInit } from './rewards-data-service-init';
import { buildControllerInitRequestMock } from './test/utils';

jest.mock('../controllers/rewards/rewards-data-service');

function buildInitRequestMock() {
  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    PreferencesControllerGetStateAction,
    never
  >({ namespace: MOCK_ANY_NAMESPACE });

  // Register a mock PreferencesController:getState handler
  baseControllerMessenger.registerActionHandler(
    'PreferencesController:getState',
    () => ({ currentLocale: 'en-US' }) as never,
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRewardsDataServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  } as unknown as jest.Mocked<
    ControllerInitRequest<RewardsDataServiceMessenger>
  >;
}

describe('RewardsDataServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(RewardsDataServiceInit(requestMock).controller).toBeInstanceOf(
      RewardsDataService,
    );
  });

  it('should initialize controller with correct parameters', () => {
    const requestMock = buildInitRequestMock();
    RewardsDataServiceInit(requestMock);

    const controllerMock = jest.mocked(RewardsDataService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      fetch: expect.any(Function),
    });
  });
});
