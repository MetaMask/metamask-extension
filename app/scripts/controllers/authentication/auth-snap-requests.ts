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
      jsonrpc: '2.0',
      method: 'getPublicKey',
      params: [],
      id: 1,
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
      jsonrpc: '2.0',
      method: 'signMessage',
      params: { message },
      id: 1,
    },
  };
}
