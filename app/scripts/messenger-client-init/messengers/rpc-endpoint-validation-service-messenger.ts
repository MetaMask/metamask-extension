import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import type { RpcEndpointValidationServiceMessenger } from '../../services/rpc-endpoint-validation-service';

/**
 * Create the stateless RPC validator messenger without delegated authority.
 *
 * @param messenger - The root messenger.
 * @returns The validator's messenger.
 */
export function getRpcEndpointValidationServiceMessenger(
  messenger: RootMessenger<never, never>,
): RpcEndpointValidationServiceMessenger {
  return new Messenger({
    namespace: 'RpcEndpointValidationService',
    parent: messenger,
  });
}
