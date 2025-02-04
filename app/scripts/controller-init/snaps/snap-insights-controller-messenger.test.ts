import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getSnapInsightsControllerMessenger } from './snap-insights-controller-messenger';

describe('getSnapInsightsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const snapInsightsControllerMessenger =
      getSnapInsightsControllerMessenger(messenger);

    expect(snapInsightsControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
