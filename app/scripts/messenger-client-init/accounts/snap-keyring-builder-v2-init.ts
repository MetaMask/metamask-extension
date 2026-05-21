import { MessengerClientInitFunction } from '../types';
import {
  SnapKeyringBuilderV2InitMessenger,
  SnapKeyringBuilderV2Messenger,
} from '../messengers/accounts';
import {
  snapKeyringBuilderV2,
  SnapKeyringBuilderV2,
} from '../../lib/snap-keyring/snap-keyring-v2';

/**
 * Initialize the v2 Snap keyring builder.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the keyring
 * builder.
 * @param request.initMessenger
 * @param request.removeAccount
 * @returns The initialized controller.
 */
export const SnapKeyringBuilderV2Init: MessengerClientInitFunction<
  SnapKeyringBuilderV2,
  SnapKeyringBuilderV2Messenger,
  SnapKeyringBuilderV2InitMessenger
> = ({ controllerMessenger, initMessenger, removeAccount }) => {
  const builder = snapKeyringBuilderV2(controllerMessenger, {
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
