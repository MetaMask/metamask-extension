import { Messenger } from '@metamask/messenger';
import { getPreferencesControllerMessenger } from './preferences-controller-messenger';
import { getRootMessenger } from '.';

describe('getPreferencesControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const preferencesControllerMessenger =
      getPreferencesControllerMessenger(controllerMessenger);

    expect(preferencesControllerMessenger).toBeInstanceOf(Messenger);
  });
});
