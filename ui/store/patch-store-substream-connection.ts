import type { Substream } from '@metamask/object-multiplex/dist/Substream';
import { createDeferredPromise, hasProperty, isObject } from '@metamask/utils';
import type { JsonRpcNotification } from '@metamask/utils';
import type { Patch } from 'immer';

import { PATCH_STORE_SUBSTREAM_METHODS } from '../../shared/constants/patch-store-substream-methods';
import getNextId from '../../shared/lib/random-id';
import { onStreamClosed } from '../../shared/lib/stream-utils';

/**
 * A notification with the method `sendUpdate`.
 */
type SendUpdateNotification = JsonRpcNotification & {
  method: typeof PATCH_STORE_SUBSTREAM_METHODS.SendUpdate;
  params: [Patch[]];
};

/**
 * The response for a `getStatePatches` request.
 *
 * Roughly matches a `JsonRpcResponse`.
 */
type GetStatePatchesResponse = { id: number } & (
  | { result: Patch[] }
  | { error: unknown }
);

/**
 * Type guard to identify a `sendUpdate` notification.
 *
 * @param message - The message to identify.
 * @param message.method - The RPC method on the message.
 */
function isSendUpdateNotification(message: {
  method: unknown;
}): message is SendUpdateNotification {
  return message.method === PATCH_STORE_SUBSTREAM_METHODS.SendUpdate;
}

/**
 * Manages the connection to the patch-store substream, handling incoming
 * messages from the background process and outgoing requests for state patches.
 */
export class PatchStoreSubstreamConnection {
  /**
   * A map of request IDs to deferred promises, used to resolve pending requests
   * for `getStatePatches`.
   */
  readonly #pendingGetStatePatchesRequests = new Map<
    number,
    {
      resolve: (value: Patch[]) => void;
      reject: (error: unknown) => void;
    }
  >();

  /**
   * The substream.
   */
  readonly #patchStoreSubstream: Substream;

  /**
   * How to handle a notification for `sendUpdate`.
   */
  readonly #handleSendUpdate: (
    notification: SendUpdateNotification,
  ) => void | Promise<void>;

  /**
   * Constructs a PatchStoreSubstreamConnection.
   *
   * @param patchStoreSubstream - The substream.
   * @param additionalArgs - Additional arguments.
   * @param additionalArgs.handleSendUpdate - How to handle a notification for
   * `sendUpdate`. Used to update the `metamask` slice in the Redux store.
   */
  constructor(
    patchStoreSubstream: Substream,
    {
      handleSendUpdate,
    }: {
      handleSendUpdate: (
        notification: SendUpdateNotification,
      ) => void | Promise<void>;
    },
  ) {
    this.#patchStoreSubstream = patchStoreSubstream;
    this.#handleSendUpdate = handleSendUpdate;

    this.#patchStoreSubstream.on('data', (message) => {
      this.#receiveMessage(message).catch((error) => {
        console.error(
          'Error receiving message through patch-store stream',
          error,
        );
      });
    });
  }

  /**
   * Retrieves the latest batch of state updates collected by the background.
   * This is used to force the UI to rerender.
   */
  async getStatePatches(): Promise<Patch[]> {
    const id = getNextId();
    const { promise, resolve, reject } = createDeferredPromise<Patch[]>();
    this.#pendingGetStatePatchesRequests.set(id, { resolve, reject });
    this.#patchStoreSubstream.write({
      id,
      jsonrpc: '2.0' as const,
      method: PATCH_STORE_SUBSTREAM_METHODS.GetStatePatches,
    });

    return await promise;
  }

  /**
   * Fails all pending `getStatePatches` requests with a disconnect error.
   *
   * Called when the patch-store substream closes or finishes, so that callers
   * do not hang indefinitely.
   */
  rejectAllPendingRequests() {
    this.#pendingGetStatePatchesRequests.forEach(({ reject }) => {
      reject(new Error('Patch-store substream closed, aborting request'));
    });
    this.#pendingGetStatePatchesRequests.clear();
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
   */
  async #receiveMessage(message: unknown): Promise<void> {
    // We cannot use `isJsonRpcNotification` and/or `isJsonRpcResponse` because
    // the message object may not be completely JSON-compatible.
    if (isObject(message) && hasProperty(message, 'id')) {
      // Type assertion: We assume we have a response to a previous
      // `getStatePatches` request. (These responses can be quite large so we
      // avoid a runtime check for performance reasons.)
      this.#resolvePendingGetStatePatchesRequest(
        message as GetStatePatchesResponse,
      );
    } else if (isObject(message) && hasProperty(message, 'method')) {
      if (isSendUpdateNotification(message)) {
        return await this.#handleSendUpdate(message);
      }

      console.warn(
        `Invalid method '${String(message.method)}' for patch-store notification`,
      );
    } else {
      console.error('Unknown patch-store message', message);
    }
  }

  /**
   * Handles the response from a previous request for `getStatePatches` by
   * resolving the pending promise for that request.
   *
   * @param response - The response received through the background connection.
   * @param response.id - The `id` field on the response.
   * @param response.result - The state patches.
   * @param response.error - The error within the response.
   * @throws If the previous request corresponding to the response cannot be
   * found.
   */
  #resolvePendingGetStatePatchesRequest(response: GetStatePatchesResponse) {
    const { id } = response;
    const pendingRequest = this.#pendingGetStatePatchesRequests.get(id);
    if (!pendingRequest) {
      console.error(
        `Encountered response for unexpected patch-store stream request '${id}'`,
        response,
      );
      return;
    }

    this.#pendingGetStatePatchesRequests.delete(id);

    if ('error' in response) {
      pendingRequest.reject(response.error);
    } else {
      const { result } = response;
      pendingRequest.resolve(result);
    }
  }
}

let patchStoreSubstreamConnectionSingleton:
  | PatchStoreSubstreamConnection
  | undefined;

/**
 * Fails all pending `getStatePatches` requests with a disconnect error, then
 * clears the patch-store substream connection singleton.
 *
 * Called when the patch-store substream closes or finishes, so that callers do
 * not hang indefinitely.
 */
function onPatchStoreSubstreamClosed() {
  patchStoreSubstreamConnectionSingleton?.rejectAllPendingRequests();
  patchStoreSubstreamConnectionSingleton = undefined;
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
  if (patchStoreSubstreamConnectionSingleton) {
    throw new Error('patch-store substream connection is already set up');
  }

  patchStoreSubstreamConnectionSingleton = new PatchStoreSubstreamConnection(
    patchStoreSubstream,
    { handleSendUpdate },
  );

  onStreamClosed(patchStoreSubstream, onPatchStoreSubstreamClosed);
}

/**
 * Retrieves the latest batch of state updates collected by the background. This
 * is used to force the UI to rerender.
 */
export async function getStatePatches(): Promise<Patch[]> {
  if (!patchStoreSubstreamConnectionSingleton) {
    if (!process.env.IN_TEST) {
      console.error(
        'Patch-store substream has not been initialized, not sending message',
      );
    }
    return [];
  }

  return patchStoreSubstreamConnectionSingleton.getStatePatches();
}
