import { JsonSnapsRegistry } from '@metamask/snaps-controllers';

import { getBooleanFlag } from '../../lib/util';
import type { SnapsRegistryMessenger } from '../messengers/snaps';
import type { ControllerInitFunction } from '../types';

/**
 * Initialize the Snaps registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapsRegistryInit: ControllerInitFunction<
  JsonSnapsRegistry,
  SnapsRegistryMessenger
> = ({ controllerMessenger, persistedState }) => {
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);

  const controller = new JsonSnapsRegistry({
    // @ts-expect-error: `persistedState.SnapsRegistry` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapsRegistry,
    messenger: controllerMessenger,
    refetchOnAllowlistMiss: requireAllowlist,
  });

  return {
    controller,
  };
};
