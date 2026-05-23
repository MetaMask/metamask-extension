import { MessengerClientInitFunction } from '../types';
import { SnapKeyringBuilderInitMessenger } from '../messengers/accounts';
import {
  snapKeyringBuilder,
  SnapKeyringBuilder,
} from '../../lib/snap-keyring/snap-keyring';
import { SnapKeyringBuilderMessenger } from '../../lib/snap-keyring/types';

/**
 * Initialize the Snap keyring builder.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the keyring
 * builder.
 * @param request.initMessenger
 * @param request.removeAccount
 * @returns The initialized controller.
 */
export const SnapKeyringBuilderInit: MessengerClientInitFunction<
  SnapKeyringBuilder,
  SnapKeyringBuilderMessenger,
  SnapKeyringBuilderInitMessenger
> = ({ controllerMessenger, initMessenger, removeAccount }) => {
  const builder = snapKeyringBuilder(controllerMessenger, {
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
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient: builder,
  };
};
