import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '..';
import { getSnapInsightsControllerMessenger } from './snap-insights-controller-messenger';

describe('getSnapInsightsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const snapInsightsControllerMessenger =
      getSnapInsightsControllerMessenger(messenger);

    expect(snapInsightsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
