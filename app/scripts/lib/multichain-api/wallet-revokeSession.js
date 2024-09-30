import {
  PermissionDoesNotExistError,
  UnrecognizedSubjectError,
} from '@metamask/permission-controller';
import { EthereumRpcError } from 'eth-rpc-errors';
import { rpcErrors } from '@metamask/rpc-errors';
import { Caip25EndowmentPermissionName } from './caip25permissions';

export async function walletRevokeSessionHandler(
  request,
  response,
  _next,
  end,
  hooks,
) {
  try {
    hooks.revokePermission(request.origin, Caip25EndowmentPermissionName);
  } catch (err) {
    if (
      err instanceof UnrecognizedSubjectError ||
      err instanceof PermissionDoesNotExistError
    ) {
      return end(new EthereumRpcError(5501, 'No active sessions'));
    }
    console.error(err);
    return end(rpcErrors.internal());
  }

  response.result = true;
  return end();
}
