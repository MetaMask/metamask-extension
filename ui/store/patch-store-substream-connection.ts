import type { Substream } from '@metamask/object-multiplex/dist/Substream';
import type { Patch } from 'immer';
import type {
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import {
  createDeferredPromise,
  isJsonRpcNotification,
  isJsonRpcResponse,
} from '@metamask/utils';
import {
  array,
  is,
  literal,
  number,
  object,
  optional,
  string,
  union,
  unknown,
} from '@metamask/superstruct';
import { GET_STATE_PATCHES, SEND_UPDATE } from '../../shared/constants/patches';
import getNextId from '../../shared/lib/random-id';

let patchStoreSubstreamSingleton: Substream | undefined;

/**
 * A map of request IDs to deconstructed promises, used to resolve pending
 * requests for `getStatePatches`.
 */
const pendingGetStatePatchesRequests = new Map<
  number,
  {
    resolve: (value: Patch[]) => void;
    reject: (error: unknown) => void;
  }
>();

/**
 * The struct that identifies an array of JSON patch objects.
 */
export const PatchesStruct = array(
  object({
    op: union([literal('replace'), literal('remove'), literal('add')]),
    path: array(union([string(), number()])),
    value: optional(unknown()),
  }),
);

/**
 * Identifies an array of JSON patch objects.
 *
 * @param patches - The possible list of JSON patches.
 */
function arePatches(patches: unknown): patches is Patch[] {
  return is(patches, PatchesStruct);
}

/**
 * The `id` property for a JSON-RPC response is technically allowed to be
 * `null`, but we're not interested in those. This function can be used to
 * filter them out.
 *
 * @param response - The possible response.
 */
function isValidJsonRpcResponse(
  response: unknown,
): response is JsonRpcResponse & { id: number } {
  return isJsonRpcResponse(response) && typeof response.id === 'number';
}

/**
 * Identifies a `sendUpdate` notification.
 *
 * @param notification - A JSON-RPC notification.
 */
function isSendUpdateNotification(
  notification: JsonRpcNotification,
): notification is JsonRpcNotification & { params: [Patch[]] } {
  return (
    notification.method === SEND_UPDATE &&
    Array.isArray(notification.params) &&
    arePatches(notification.params[0])
  );
}

/**
 * Sends a request through the connection stream to the background.
 *
 * @param message - The message to send.
 * @returns The response from the request.
 */
async function sendMessage(message: JsonRpcRequest & { id: number }) {
  const { promise, resolve, reject } = createDeferredPromise<Patch[]>();
  pendingGetStatePatchesRequests.set(message.id, { resolve, reject });

  if (patchStoreSubstreamSingleton) {
    patchStoreSubstreamSingleton.write(message);
  } else if (process.env.IN_TEST) {
    // The background side isn't always set up in tests, so just do nothing
    return;
  } else {
    console.warn(
      'Patch-store substream has not been initialized, not sending message',
    );
  }

  return await promise;
}

/**
 * Handles the response from a previous request to the background by
 * resolving the pending promise for that request.
 *
 * @param message - The message sent through the background connection.
 * @throws If the previous request corresponding to the response cannot be
 * found.
 */
function resolvePendingGetStatePatchesRequest(
  message: JsonRpcResponse & { id: number },
) {
  const { id } = message;
  const request = pendingGetStatePatchesRequests.get(id);
  if (!request) {
    console.error(
      `Encountered response for unexpected patch-store stream request '${id}'`,
      message,
    );
    return;
  }

  pendingGetStatePatchesRequests.delete(id);

  if ('error' in message) {
    request.reject(message.error);
  } else {
    const { result } = message;

    if (arePatches(result)) {
      request.resolve(result);
    } else {
      console.error(
        `Invalid response for patch-store stream request ID '${id}'`,
        message,
      );
    }
  }
}

/**
 * Handler to act on messages sent from the background process to this UI
 * process. These messages are:
 *
 * - Responses from `getStatePatches` requests
 * - `sendUpdate` notifications
 *
 * For the background side of this, see `setupPatchStoreSubstream` in
 * MetamaskController.
 *
 * @param message - The message received through the connection stream.
 * @param handleSendUpdate - Function to call when receiving a `sendUpdate`
 * notification.
 */
async function receiveMessage(
  message: JsonRpcResponse | JsonRpcNotification,
  handleSendUpdate: (
    notification: JsonRpcNotification & { params: [Patch[]] },
  ) => void | Promise<void>,
): Promise<void> {
  if (isValidJsonRpcResponse(message)) {
    return resolvePendingGetStatePatchesRequest(message);
  }

  if (isJsonRpcNotification(message) && isSendUpdateNotification(message)) {
    return await handleSendUpdate(message);
  }

  console.error('Invalid patch-store substream message', message);
}

/**
 * Listens and acts on for responses from previous `getStatePatches` requests
 * and `sendUpdate` notifications.
 *
 * @param patchStoreSubstream - The connection with the background process.
 * @param options - Options for the patch store connection.
 * @param options.handleSendUpdate - Function to call when receiving a
 * `sendUpdate` notification.
 */
export function setupPatchStoreSubstreamConnection(
  patchStoreSubstream: Substream,
  {
    handleSendUpdate,
  }: {
    handleSendUpdate: (
      notification: JsonRpcNotification & { params: [Patch[]] },
    ) => void | Promise<void>;
  },
) {
  patchStoreSubstreamSingleton = patchStoreSubstream;
  patchStoreSubstreamSingleton.on('data', (message) => {
    receiveMessage(message, handleSendUpdate);
  });
}

/**
 * Retrieves the latest batch of state updates collected by the background. This
 * is used to force the UI to rerender.
 */
export async function getStatePatches(): Promise<Patch[]> {
  const patches = await sendMessage({
    id: getNextId(),
    jsonrpc: '2.0' as const,
    method: GET_STATE_PATCHES,
  });
  return patches ?? [];
}
