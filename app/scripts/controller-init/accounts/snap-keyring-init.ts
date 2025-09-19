import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { ControllerInitFunction } from '../types';
import {
  SnapKeyringInitMessenger,
  SnapKeyringMessenger,
} from '../messengers/accounts';
import { SnapKeyringImpl } from '../../lib/snap-keyring/snap-keyring';

/**
 * Initialize the Snap keyring.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the keyring.
 * @param request.initMessenger
 * @param request.removeAccount
 * @returns The initialized controller.
 */
export const SnapKeyringInit: ControllerInitFunction<
  SnapKeyring,
  SnapKeyringMessenger,
  SnapKeyringInitMessenger
> = ({ controllerMessenger, initMessenger, removeAccount }) => {
  const keyring = new SnapKeyring({
    messenger: controllerMessenger,
    callbacks: new SnapKeyringImpl(controllerMessenger, {
      persistKeyringHelper: async () => {
        await initMessenger.call('KeyringController:persistAllKeyrings');
        await initMessenger.call('AccountsController:updateAccounts');
      },
      removeAccountHelper: async (address) => {
        await removeAccount(address);
      },
      trackEvent: initMessenger.call.bind(
        initMessenger,
        'MetaMetricsController:trackEvent',
      ),
    }),

    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    // Enables generic account creation for new chain integration. It's
    // Flask-only since production should use defined account types.
    isAnyAccountTypeAllowed: true,
    ///: END:ONLY_INCLUDE_IF
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller: keyring,
  };
};
