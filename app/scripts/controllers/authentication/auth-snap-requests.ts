import type { SnapId } from '@metamask/snaps-sdk';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { HandlerType } from '@metamask/snaps-utils';

type SnapRPCRequest = Parameters<HandleSnapRequest['handler']>[0];

const snapId = 'npm:@metamask/message-signing-snap' as SnapId;

export function createSnapPublicKeyRequest(): SnapRPCRequest {
  return {
    snapId,
    origin: '',
    handler: HandlerType.OnRpcRequest,
    request: {
      method: 'getPublicKey',
    },
  };
}

export function createSnapSignMessageRequest(
  message: `metamask:${string}`,
): SnapRPCRequest {
  return {
    snapId,
    origin: '',
    handler: HandlerType.OnRpcRequest,
    request: {
      method: 'signMessage',
      params: { message },
    },
  };
}
