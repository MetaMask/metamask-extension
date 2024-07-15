import { EthereumRpcError } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeScopes } from './scope';

export async function walletGetSessionHandler(
  request,
  response,
  _next,
  end,
  hooks,
) {
  if (request.params?.sessionId) {
    return end(
      new EthereumRpcError(5500, 'SessionId not recognized'), // we aren't currently storing a sessionId to check this against
    );
  }

  const caveat = hooks.getCaveat(
    request.origin,
    Caip25EndowmentPermissionName,
    Caip25CaveatType,
  );
  if (!caveat) {
    return end(new EthereumRpcError(5501, 'No active sessions'));
  }

  response.result = {
    scopes: mergeScopes(
      caveat.value.requiredScopes,
      caveat.value.optionalScopes,
    ),
  };
  return end();
}
