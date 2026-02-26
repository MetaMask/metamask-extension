import type { Hex, Json, JsonRpcRequest } from '@metamask/utils';
import { HandlerType } from '@metamask/snaps-utils';
import type { SnapController } from '@metamask/snaps-controllers';
import { InternalError, type SnapId } from '@metamask/snaps-sdk';
import { WalletMiddlewareContext } from '@metamask/eth-json-rpc-middleware';

/**
 * Forwards a JSON-RPC request to a specified Snap by invoking its `handleRequest` method.
 * Throws an error if no snapId is provided.
 *
 * @param config - The config for forwarding the request.
 * @param config.handleRequest - The SnapController's handleRequest function.
 * @param config.snapId - The ID of the Snap to forward the request to.
 * @param config.onBeforeRequest - A function to call before forwarding the request.
 * @param config.onAfterRequest - A function to call after forwarding the request.
 * @param _params - Additional parameters, including the request ID.
 * @param _params.id - The request ID.
 * @param req - The JSON-RPC request object.
 * @param context - The WalletMiddlewareContext object.
 * @returns The response from the Snap as JSON.
 */
export async function forwardRequestToSnap(
  config: {
    handleRequest: SnapController['handleRequest'];
    onBeforeRequest?: () => void;
    onAfterRequest?: () => void;
    snapId: SnapId;
  },
  _params: {
    id: Hex;
  },
  req: JsonRpcRequest,
  context: WalletMiddlewareContext,
): Promise<Json> {
  const { method, params } = req;
  const { handleRequest, snapId, onBeforeRequest, onAfterRequest } = config;

  if (!snapId) {
    throw new InternalError(`No snapId configured for method ${method}`);
  }

  const origin = context.get('origin');

  if (!origin) {
    throw new InternalError(`No origin specified for method ${method}`);
  }

  /*
  the hooks should be designed so that they don't throw, but we need to handle them anyway

  if handleRequest throws, its error must be thrown to the caller.
  if handleRequest resolves, but either hook throws, the hook's error must be thrown to the caller.
  if onBeforeRequest throws, onAfterRequest _must_ still be called.
  if handleRequest throws, onAfterRequest _must_ still be called.
  if _both_ onBeforeRequest and onAfterRequest throw it's ambiguous which error should be thrown to the caller, we throw onBeforeRequest's error under the presumption that this error is more likely to be the root cause.
*/

  try {
    onBeforeRequest?.();
  } catch (error) {
    try {
      onAfterRequest?.();
    } catch (_errorFromAfterRequestHook) {
      // because an error was thrown in onBeforeRequest, we only log this error, so that the main error can be thrown to the caller.
      console.error(
        'Error from onAfterRequest hook:',
        _errorFromAfterRequestHook,
      );
    }
    throw error;
  }

  let response: Json;

  try {
    response = (await handleRequest({
      snapId,
      origin,
      handler: HandlerType.OnRpcRequest,
      request: {
        jsonrpc: '2.0',
        method,
        params,
      },
    })) as Json;
  } catch (error) {
    try {
      onAfterRequest?.();
    } catch (_errorFromAfterRequestHook) {
      // because an error was thrown in handleRequest, we only log this error, so that the main error can be thrown to the caller.
      console.error(
        'Error from onAfterRequest hook:',
        _errorFromAfterRequestHook,
      );
    }

    throw error;
  }

  onAfterRequest?.();

  return response;
}
