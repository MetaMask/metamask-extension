import type { DefaultActions, DefaultEvents } from '@metamask/wallet';
import {
  PreferencesController,
  type PreferencesControllerState,
} from '../../controllers/preferences-controller';
import { createMockMessenger } from '../test-utils';
import { preferencesControllerConfiguration } from './preferences-controller';

jest.mock('../../controllers/preferences-controller');

/**
 * Build a parent root messenger typed as the wallet's default root, which is
 * what `getMessenger` receives.
 *
 * @returns The mock parent messenger.
 */
function getParentMessenger() {
  return createMockMessenger<DefaultActions, DefaultEvents>();
}

describe('preferencesControllerConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches the wallet default config name so it replaces, not duplicates, it', () => {
    expect(preferencesControllerConfiguration.name).toBe(
      'PreferencesController',
    );
  });

  describe('init', () => {
    it('constructs the extension superset PreferencesController with the given state and messenger', () => {
      const messenger =
        preferencesControllerConfiguration.getMessenger(getParentMessenger());
      const state = {
        currentLocale: 'en-US',
      } as PreferencesControllerState;

      const controller = preferencesControllerConfiguration.init({
        state,
        messenger,
        options: undefined,
      });

      expect(PreferencesController).toHaveBeenCalledWith({ state, messenger });
      expect(controller).toBeInstanceOf(PreferencesController);
    });
  });

  describe('getMessenger', () => {
    it('delegates exactly the AccountsController actions the superset calls', () => {
      const parent = getParentMessenger();
      const delegate = jest.spyOn(parent, 'delegate');

      const messenger = preferencesControllerConfiguration.getMessenger(parent);

      expect(delegate).toHaveBeenCalledWith({
        messenger,
        actions: [
          'AccountsController:getAccountByAddress',
          'AccountsController:setAccountName',
        ],
      });
    });

    it('routes a delegated action call from the child through to the parent handler', () => {
      const parent = getParentMessenger();
      const setAccountName = jest.fn();
      parent.registerActionHandler(
        'AccountsController:setAccountName',
        setAccountName,
      );

      const messenger = preferencesControllerConfiguration.getMessenger(parent);
      messenger.call(
        'AccountsController:setAccountName',
        'account-id',
        'New Name',
      );

      expect(setAccountName).toHaveBeenCalledWith('account-id', 'New Name');
    });
  });
});
