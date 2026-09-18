import {
  SnapRegistryController,
  SnapRegistryControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitFunction } from '../types';
import { getBooleanFlag } from '../../lib/util';
import { getClientConfig } from './utils';

/**
 * Initialize the Snaps registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapRegistryControllerInit: MessengerClientInitFunction<
  SnapRegistryController,
  SnapRegistryControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);

  const messengerClient = new SnapRegistryController({
    // @ts-expect-error: `persistedState.SnapRegistryController` is not
    // compatible with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapRegistryController,
    messenger: controllerMessenger,
    refetchOnAllowlistMiss: requireAllowlist,
    clientConfig: getClientConfig(),
  });

  return {
    messengerClient,
  };
};
