import type { Substream } from '@metamask/object-multiplex/dist/Substream';
import type { Patch } from 'immer';
import getNextId from '../../shared/modules/random-id';
import {
  createDeferredPromise,
  hasProperty,
  isObject,
  JsonRpcResponse,
} from '@metamask/utils';

let patchSubstreamSingleton: Substream | undefined;

const pendingPatchRequests = new Map<
  number,
  {
    resolve: (value: Patch[]) => void;
    reject: (error: unknown) => void;
  }
>();

function handleResponse(response: JsonRpcResponse): void {
  if (
    !isObject(response) ||
    !hasProperty(response, 'jsonrpc') ||
    response.jsonrpc !== '2.0' ||
    !hasProperty(response, 'method') ||
    !hasProperty(response, 'id') ||
    typeof response.id !== 'number'
  ) {
    console.error(`Invalid patch stream message`, { message: response });
    return;
  }

  // @ts-expect-error TODO: fix
  const { id, error, result } = response;
  const request = pendingPatchRequests.get(id);
  if (!request) {
    console.error(`Missing pending request with id '${id}'`, { response });
    return;
  }

  pendingPatchRequests.delete(id);

  if (error) {
    request.reject(error);
  } else {
    // TODO: validate type
    request.resolve(result as Patch[]);
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
