import { MessengerClientInitFunction } from '../types';
import {
  SnapKeyringV2BuilderInitMessenger,
  SnapKeyringV2BuilderMessenger,
} from '../messengers/accounts';
import {
  snapKeyringV2Builder,
  SnapKeyringV2Builder,
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
export const SnapKeyringV2BuilderInit: MessengerClientInitFunction<
  SnapKeyringV2Builder,
  SnapKeyringV2BuilderMessenger,
  SnapKeyringV2BuilderInitMessenger
> = ({ controllerMessenger, initMessenger, removeAccount }) => {
  const builder = snapKeyringV2Builder(controllerMessenger, {
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
