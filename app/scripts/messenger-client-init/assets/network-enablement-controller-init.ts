import {
  NetworkEnablementController,
  NetworkEnablementControllerMessenger,
} from '@metamask/network-enablement-controller';
import { setupNetworkEnablementController } from '../../wallet-init/instance-options/network-enablement-controller';
import { NetworkEnablementControllerInitMessenger } from '../messengers/assets';
import { MessengerClientInitFunction } from '../types';

/**
 * Apply extension-only NetworkEnablementController behavior to the instance
 * `@metamask/wallet` already constructed.
 *
 * The wallet instance is returned with null state keys so the extension store
 * does not persist it a second time. `metamask-controller` reads it via
 * `wallet.getInstance`.
 *
 * @param request - The messenger-client init request.
 * @param request.initMessenger - Messenger for account-switch subscriptions.
 * @param request.persistedState - Persisted state used to detect a first run.
 * @param request.getMessengerClient - Resolves the wallet-owned controller.
 * @returns The wallet instance, excluded from both extension state maps.
 */
export const NetworkEnablementControllerInit: MessengerClientInitFunction<
  NetworkEnablementController,
  NetworkEnablementControllerMessenger,
  NetworkEnablementControllerInitMessenger
> = ({ initMessenger, persistedState, getMessengerClient }) => {
  const messengerClient = getMessengerClient('NetworkEnablementController');

  setupNetworkEnablementController({
    networkEnablementController: messengerClient,
    initMessenger,
    persistedState,
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
