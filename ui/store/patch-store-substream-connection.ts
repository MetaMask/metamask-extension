import type { Substream } from '@metamask/object-multiplex/dist/Substream';
import { createDeferredPromise, hasProperty, isObject } from '@metamask/utils';
import type { JsonRpcNotification } from '@metamask/utils';
import type { Patch } from 'immer';

import { GET_STATE_PATCHES, SEND_UPDATE } from '../../shared/constants/patches';
import getNextId from '../../shared/lib/random-id';

/**
 * A notification with the method `sendUpdate`.
 */
type SendUpdateNotification = JsonRpcNotification & {
  method: typeof SEND_UPDATE;
  params: [Patch[]];
};

let patchStoreSubstreamSingleton: Substream | undefined;

/**
 * A map of request IDs to deferred promises, used to resolve pending requests
 * for `getStatePatches`.
 */
const pendingGetStatePatchesRequests = new Map<
  number,
  {
    resolve: (value: Patch[]) => void;
    reject: (error: unknown) => void;
  }
>();

/**
 * Type guard to identify a `sendUpdate` notification.
 *
 * @param message - The message to identify.
 * @param message.method - The RPC method on the message.
 */
function isSendUpdateNotification(message: {
  method: unknown;
}): message is SendUpdateNotification {
  return message.method === SEND_UPDATE;
}

/**
 * Handles the response from a previous request for `getStatePatches` by
 * resolving the pending promise for that request.
 *
 * @param message - The message sent through the background connection.
 * @param message.id - The `id` field on the message.
 * @param message.result - The state patches.
 * @throws If the previous request corresponding to the response cannot be
 * found.
 */
function resolvePendingGetStatePatchesRequest(message: {
  id: number;
  result: Patch[];
}) {
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
    request.resolve(result);
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
 * @param message - The raw message received through the connection stream.
 * @param handleSendUpdate - Function to call when receiving a `sendUpdate`
 * notification.
 */
async function receiveMessage(
  message: unknown,
  handleSendUpdate: (
    notification: SendUpdateNotification,
  ) => void | Promise<void>,
): Promise<void> {
  // We cannot use `isJsonRpcNotification` and/or `isJsonRpcResponse` because
  // the message object may not be completely JSON-compatible.
  if (isObject(message) && hasProperty(message, 'id')) {
    // Type assertion: We assume we have a response to a previous
    // `getStatePatches` request. (These responses can be quite large so we avoid
    // a runtime check for performance reasons.)
    resolvePendingGetStatePatchesRequest(
      message as unknown as {
        id: number;
        result: Patch[];
      },
    );
  } else if (isObject(message) && hasProperty(message, 'method')) {
    if (isSendUpdateNotification(message)) {
      return await handleSendUpdate(message);
    }

    console.warn(
      `Invalid method '${String(message.method)}' for patch-store notification`,
    );
  } else {
    // Ignore noise which can cause processing errors.
  }
}

/**
 * Fails all pending `getStatePatches` requests with a disconnect error. Called
 * when the patch-store substream closes or finishes, so that callers do not
 * hang indefinitely.
 */
function failPendingRequests() {
  pendingGetStatePatchesRequests.forEach(({ reject }) => {
    reject(new Error('Patch-store substream closed, aborting request'));
  });
  pendingGetStatePatchesRequests.clear();
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
      notification: SendUpdateNotification,
    ) => void | Promise<void>;
  },
) {
  patchStoreSubstreamSingleton = patchStoreSubstream;
  patchStoreSubstreamSingleton.on('data', (message) => {
    receiveMessage(message, handleSendUpdate).catch((error) => {
      console.error(
        'Error receiving message through patch-store stream',
        error,
      );
    });
  });
  patchStoreSubstreamSingleton.on('finish', failPendingRequests);
  patchStoreSubstreamSingleton.on('close', failPendingRequests);
}

/**
 * Retrieves the latest batch of state updates collected by the background. This
 * is used to force the UI to rerender.
 */
export async function getStatePatches(): Promise<Patch[]> {
  if (!patchStoreSubstreamSingleton) {
    if (!process.env.IN_TEST) {
      console.error(
        'Patch-store substream has not been initialized, not sending message',
      );
    }
    return [];
  }

  const id = getNextId();
  const { promise, resolve, reject } = createDeferredPromise<Patch[]>();
  pendingGetStatePatchesRequests.set(id, { resolve, reject });
  patchStoreSubstreamSingleton.write({
    id,
    jsonrpc: '2.0' as const,
    method: GET_STATE_PATCHES,
  });

  return await promise;
}
