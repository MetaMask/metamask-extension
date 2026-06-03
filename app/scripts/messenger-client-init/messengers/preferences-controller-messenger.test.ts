import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getPreferencesControllerMessenger } from './preferences-controller-messenger';

describe('getPreferencesControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const preferencesControllerMessenger =
      getPreferencesControllerMessenger(controllerMessenger);

    expect(preferencesControllerMessenger).toBeInstanceOf(Messenger);
  });
});
