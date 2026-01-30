//========
// This file stores the patch substream and handles making requests to the
// background to get patches from the patch store.
//========

import type { Substream } from '@metamask/object-multiplex/dist/Substream';
import type { Patch } from 'immer';
import {
  createDeferredPromise,
  isJsonRpcResponse,
  JsonRpcResponse,
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
import getNextId from '../../shared/modules/random-id';

let patchSubstreamSingleton: Substream | undefined;

const pendingPatchRequests = new Map<
  number,
  {
    resolve: (value: Patch[]) => void;
    reject: (error: unknown) => void;
  }
>();

function isValidResponse(
  response: JsonRpcResponse,
): response is JsonRpcResponse & { id: number } {
  return isJsonRpcResponse(response) && typeof response.id === 'number';
}

export const PatchesStruct = array(
  object({
    op: union([literal('replace'), literal('remove'), literal('add')]),
    path: array(union([string(), number()])),
    value: optional(unknown()),
  }),
);

function arePatches(patches: unknown): patches is Patch[] {
  return is(patches, PatchesStruct);
}

function handleResponse(response: JsonRpcResponse): void {
  if (!isValidResponse(response)) {
    console.error(`Invalid patch stream message`, { message: response });
    return;
  }

  const { id } = response;
  const request = pendingPatchRequests.get(id);
  if (!request) {
    console.error(`Missing pending request with id '${id}'`, { response });
    return;
  }

  pendingPatchRequests.delete(id);

  if ('error' in response) {
    request.reject(response.error);
  } else {
    const { result } = response;
    if (!arePatches(result)) {
      console.error(`Invalid patch stream message`, { message: response });
      return;
    }
    request.resolve(result);
  }
}

export function setupPatchSubstream(patchSubstream: Substream) {
  patchSubstreamSingleton = patchSubstream;
  patchSubstreamSingleton.on('data', handleResponse);
}

export async function getStatePatches(): Promise<Patch[]> {
  if (!patchSubstreamSingleton) {
    return [];
  }
  const payload = {
    id: getNextId(),
    jsonrpc: '2.0' as const,
    method: 'getStatePatches',
  };
  const { promise, resolve, reject } = createDeferredPromise<Patch[]>();
  pendingPatchRequests.set(payload.id, { resolve, reject });

  patchSubstreamSingleton.write(payload);

  return await promise;
}
