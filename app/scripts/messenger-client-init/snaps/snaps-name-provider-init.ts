import {
  SnapsNameProvider,
  SnapsNameProviderMessenger,
} from '../../lib/SnapsNameProvider';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the Snaps name provider.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the provider.
 * @returns The initialized provider.
 */
export const SnapsNameProviderInit: MessengerClientInitFunction<
  SnapsNameProvider,
  SnapsNameProviderMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new SnapsNameProvider({
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient,
  };
};
