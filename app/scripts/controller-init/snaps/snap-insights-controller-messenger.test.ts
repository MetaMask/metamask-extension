import {
  ControllerMessenger,
  RestrictedMessenger,
} from '@metamask/base-controller';
import {
  getSnapInsightsControllerMessenger
} from './snap-insights-controller-messenger';

describe('getSnapInsightsControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const snapInsightsControllerMessenger = getSnapInsightsControllerMessenger(
      controllerMessenger,
    );

    expect(snapInsightsControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
