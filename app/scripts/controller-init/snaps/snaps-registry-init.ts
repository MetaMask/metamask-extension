import { JsonSnapsRegistry } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { SnapsRegistryMessenger } from './snaps-registry-messenger';

/**
 * Initialize the Snaps registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The controller messenger to use for the
 * controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapsRegistryInit: ControllerInitFunction<
  JsonSnapsRegistry,
  SnapsRegistryMessenger
> = ({ controllerMessenger, persistedState }) => {
  const requireAllowlist = Boolean(process.env.REQUIRE_SNAPS_ALLOWLIST);

  const controller = new JsonSnapsRegistry({
    // @ts-expect-error: `persistedState.SnapsRegistry` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapsRegistry,
    messenger: controllerMessenger,
    refetchOnAllowlistMiss: requireAllowlist,
    url: {
      registry: 'https://acl.execution.metamask.io/latest/registry.json',
      signature: 'https://acl.execution.metamask.io/latest/signature.json',
    },
    publicKey:
      '0x025b65308f0f0fb8bc7f7ff87bfc296e0330eee5d3c1d1ee4a048b2fd6a86fa0a6',
  });

  return {
    controller,
  };
};
