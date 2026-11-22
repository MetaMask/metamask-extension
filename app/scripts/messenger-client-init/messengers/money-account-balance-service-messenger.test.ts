import { Messenger } from '@metamask/messenger';
import {
  MoneyAccountApiDataService,
  type PositionResponse,
} from '@metamask/money-account-api-data-service';
import { getRootMessenger } from '../../lib/messenger';
import { getMoneyAccountApiDataServiceMessenger } from './money-account-api-data-service-messenger';
import { getMoneyAccountBalanceServiceMessenger } from './money-account-balance-service-messenger';

const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';

describe('getMoneyAccountBalanceServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const serviceMessenger = getMoneyAccountBalanceServiceMessenger(messenger);

    expect(serviceMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the network, remote feature flag and money API actions', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountBalanceServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'NetworkController:getNetworkConfigurationByChainId',
          'NetworkController:getNetworkClientById',
          'RemoteFeatureFlagController:getState',
          'MoneyAccountApiDataService:fetchPositions',
        ],
      }),
    );
  });

  it('can call fetchPositions once MoneyAccountApiDataService is registered', async () => {
    const messenger = getRootMessenger<never, never>();
    const positions: PositionResponse = {
      address: MOCK_ADDRESS,
      // The Money API responds in snake_case.
      /* eslint-disable @typescript-eslint/naming-convention */
      as_of_block: 1,
      as_of_timestamp: '2026-01-01T00:00:00Z',
      data_freshness: 'live',
      indexer_lag_seconds: 0,
      /* eslint-enable @typescript-eslint/naming-convention */
      positions: [],
      balance: null,
    };
    const fetchPositions = jest
      .spyOn(MoneyAccountApiDataService.prototype, 'fetchPositions')
      .mockResolvedValue(positions);

    // The API data service registers its action handlers in its constructor.
    const apiService = new MoneyAccountApiDataService({
      messenger: getMoneyAccountApiDataServiceMessenger(messenger),
    });
    const serviceMessenger = getMoneyAccountBalanceServiceMessenger(messenger);

    expect(
      await serviceMessenger.call(
        'MoneyAccountApiDataService:fetchPositions',
        MOCK_ADDRESS,
      ),
    ).toBe(positions);
    expect(fetchPositions).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(fetchPositions.mock.instances[0]).toBe(apiService);
  });

  it('delegates the remote feature flag state change event', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getMoneyAccountBalanceServiceMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        events: ['RemoteFeatureFlagController:stateChange'],
      }),
    );
  });
});
