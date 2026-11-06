import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMarketStatsServiceMessenger } from './market-stats-service-messenger';

describe('getMarketStatsServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const messenger = getMarketStatsServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
    expect(messenger).toBeDefined();
  });
});
