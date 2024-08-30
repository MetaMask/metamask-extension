import {
  PermissionDoesNotExistError,
  UnrecognizedSubjectError,
} from '@metamask/permission-controller';
import { EthereumRpcError } from 'eth-rpc-errors';
import { Caip25EndowmentPermissionName } from './caip25permissions';
import { error } from 'console';

export async function walletRevokeSessionHandler(
  request,
  response,
  _next,
  end,
  hooks,
) {
  return end(new Error('test'))
  if (request.params?.sessionId) {
    return end(
      new EthereumRpcError(5500, 'SessionId not recognized'), // we aren't currently storing a sessionId to check this against
    );
  }

  try {
    hooks.revokePermission(request.origin, Caip25EndowmentPermissionName);
  } catch (err) {
    if (
      err instanceof UnrecognizedSubjectError ||
      err instanceof PermissionDoesNotExistError
    ) {
      return end(new EthereumRpcError(5501, 'No active sessions'));
    }

    return end(err); // TODO: handle this better
  }

  response.result = true;
  return end();
}
