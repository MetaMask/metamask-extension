import type { Hex, Json, JsonRpcRequest } from '@metamask/utils';
import { HandlerType } from '@metamask/snaps-utils';
import { JsonRpcError } from '@metamask/rpc-errors';
import type { SnapController } from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';

/**
 * Forwards a JSON-RPC request to a specified Snap by invoking its `handleRequest` method.
 * Throws an error if no snapId is provided.
 *
 * @param config - The config for forwarding the request.
 * @param config.handleRequest - The SnapController's handleRequest function.
 * @param config.snapId - The ID of the Snap to forward the request to.
 * @param _params - Additional parameters, including the request ID.
 * @param _params.id - The request ID.
 * @param req - The JSON-RPC request object.
 * @returns The response from the Snap as JSON.
 */
export async function forwardRequestToSnap(
  config: {
    handleRequest: SnapController['handleRequest'];
    snapId: SnapId;
  },
  _params: {
    id: Hex;
  },
  req: JsonRpcRequest & { origin: string },
): Promise<Json> {
  const { method, params, origin } = req;
  const { handleRequest, snapId } = config;

  if (!snapId) {
    throw new JsonRpcError(500, `No snapId configured for method ${method}`);
  }

  if (!origin) {
    throw new JsonRpcError(500, `No origin specified for method ${method}`);
  }

  const response = (await handleRequest({
    snapId,
    origin,
    handler: HandlerType.OnRpcRequest,
    request: {
      jsonrpc: '2.0',
      method,
      params,
    },
  })) as Json;

  return response;
}
