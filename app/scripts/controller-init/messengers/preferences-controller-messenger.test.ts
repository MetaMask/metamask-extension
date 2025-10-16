import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getPreferencesControllerMessenger } from './preferences-controller-messenger';

describe('getPreferencesControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const preferencesControllerMessenger =
      getPreferencesControllerMessenger(controllerMessenger);

    expect(preferencesControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
