import { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';

const snapId = 'npm:@metamask/message-signing-snap' as SnapId;

export function createSnapSignMessageRequest(message: `metamask:${string}`) {
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
