import * as ActionsModule from '../actions';
import * as BackgroundConnectionModule from '../background-connection';
import {
  multichainAssetsRatesStartPolling,
  multichainAssetsRatesStopPollingByPollingToken,
} from './multichain-asset-rates-controller';

jest.mock('../background-connection');
jest.mock('../actions');

const arrangeMocks = () => {
  const mockSubmitRequestToBackground = jest.spyOn(
    BackgroundConnectionModule,
    'submitRequestToBackground',
  );
  const mockAddPollingTokenToAppState = jest.spyOn(
    ActionsModule,
    'addPollingTokenToAppState',
  );
  const mockRemovePollingTokenFromAppState = jest.spyOn(
    ActionsModule,
    'removePollingTokenFromAppState',
  );

  const MOCK_POLLING_TOKEN = 'polling-token';
  mockSubmitRequestToBackground.mockResolvedValue(MOCK_POLLING_TOKEN);
  mockAddPollingTokenToAppState.mockResolvedValue(undefined);
  mockRemovePollingTokenFromAppState.mockResolvedValue(undefined);

  return {
    MOCK_POLLING_TOKEN,
    mockSubmitRequestToBackground,
    mockAddPollingTokenToAppState,
    mockRemovePollingTokenFromAppState,
  };
};

describe('multichainAssetsRatesStartPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start polling and return polling token', async () => {
    const mocks = arrangeMocks();
    const accountId = 'test-account-id';

    const result = await multichainAssetsRatesStartPolling(accountId);

    expect(mocks.mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'multichainAssetsRatesStartPolling',
      [{ accountId }],
    );
    expect(mocks.mockAddPollingTokenToAppState).toHaveBeenCalledWith(
      mocks.MOCK_POLLING_TOKEN,
    );
    expect(result).toBe(mocks.MOCK_POLLING_TOKEN);
  });
});

describe('multichainAssetsRatesStopPollingByPollingToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should stop polling and remove token from app state', async () => {
    const mocks = arrangeMocks();
    const pollingToken = 'existing-polling-token';

    await multichainAssetsRatesStopPollingByPollingToken(pollingToken);

    expect(mocks.mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'multichainAssetsRatesStopPollingByPollingToken',
      [pollingToken],
    );
    expect(mocks.mockRemovePollingTokenFromAppState).toHaveBeenCalledWith(
      pollingToken,
    );
  });
});
