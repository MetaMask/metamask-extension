//========
// When `submitRequestToBackground` is removed, `createMetaRPCHandler` can
// support the root messenger instead of an API object. In other words, the
// `method` property on each request is expected to correspond to an action type
// on the root messenger.
//========

import ObjectMultiplex from '@metamask/object-multiplex';
import { getErrorMessage, Json, JsonRpcRequest } from '@metamask/utils';
import { rpcErrors, serializeError } from '@metamask/rpc-errors';

import type { RootMessenger } from './messenger';
import { isStreamWritable } from './stream-utils';

// This type isn't public so we have to cheat to get it
type Substream = ReturnType<ObjectMultiplex['createStream']>;

function areArrayOfParams(params: JsonRpcRequest['params']): params is Json[] {
  return Array.isArray(params);
}

function createMetaRPCHandler(
  rootMessenger: RootMessenger,
  outStream: Substream,
) {
  return async (request: JsonRpcRequest) => {
    try {
      const { params } = request;

      if (!areArrayOfParams(params)) {
        throw new Error('Invalid params');
      }

      const result = tryCallingMessenger(rootMessenger, request.method, params);
      outStream.write({
        id: request.id,
        jsonrpc: request.jsonrpc,
        result,
      });
    } catch (error) {
      if (isStreamWritable(outStream)) {
        outStream.write({
          id: request.id,
          jsonrpc: request.jsonrpc,
          error: serializeError(error, { shouldIncludeStack: true }),
        });
      } else {
        console.error(error);
      }
    }
  };
}

function tryCallingMessenger(
  rootMessenger: RootMessenger,
  actionName: string,
  actionArgs: Json[],
): unknown {
  try {
    return rootMessenger.call(
      // @ts-expect-error It doesn't really matter what this is, we check
      // that the action is valid below.
      actionName,
      ...actionArgs,
    );
  } catch (error) {
    const message = getErrorMessage(error);
    if (message === `A handler for ${actionName} has not been registered`) {
      throw rpcErrors.methodNotFound({ message });
    }
    throw error;
  }
}

export default createMetaRPCHandler;
