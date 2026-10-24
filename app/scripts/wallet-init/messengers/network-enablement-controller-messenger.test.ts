import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getNetworkEnablementControllerInitMessenger } from './network-enablement-controller-messenger';

describe('getNetworkEnablementControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const networkEnablementControllerInitMessenger =
      getNetworkEnablementControllerInitMessenger(messenger);

    expect(networkEnablementControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the actions and events used by the extension-side listeners', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getNetworkEnablementControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'AccountTreeController:getAccountsFromSelectedAccountGroup',
          'ConfigRegistryController:getState',
        ],
        events: [
          'AccountsController:selectedAccountChange',
          'AccountTreeController:selectedAccountGroupChange',
          'NetworkController:networkAdded',
          'NetworkEnablementController:stateChange',
        ],
      }),
    );
  });
});
