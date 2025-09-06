import type { Hex, JsonRpcRequest } from '@metamask/utils';
import { HandlerType } from '@metamask/snaps-utils';
import { JsonRpcError } from '@metamask/rpc-errors';
import type { SnapController } from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import type { RequestExecutionPermissionsResult } from '@metamask/eth-json-rpc-middleware';

export async function processRequestExecutionPermissions(
  {
    handleRequest,
  }: {
    handleRequest: SnapController['handleRequest'];
  },
  params: {
    id: Hex;
  },
  req: JsonRpcRequest & { networkClientId: string; origin?: string },
): Promise<RequestExecutionPermissionsResult> {
  const { origin } = req;

  if (!origin) {
    throw new JsonRpcError(-32600, 'No origin found');
  }

  const snapId = process.env.PERMISSIONS_KERNEL_SNAP_ID;

  if (!snapId) {
    throw new JsonRpcError(
      500,
      'No snapId configured for the Permissions Kernel snap',
    );
  }

  const requestExecutionPermissionsResult = (await handleRequest({
    snapId: snapId as SnapId,
    origin,
    handler: HandlerType.OnRpcRequest,
    request: {
      jsonrpc: '2.0',
      method: 'wallet_requestExecutionPermissions',
      params,
    },
  })) as RequestExecutionPermissionsResult;

  return requestExecutionPermissionsResult;
}
