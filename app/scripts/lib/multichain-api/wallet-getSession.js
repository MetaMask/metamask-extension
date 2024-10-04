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
  let caveat;
  try {
    caveat = hooks.getCaveat(
      request.origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
    );
  } catch (e) {
    // noop
  }

  if (!caveat) {
    return end(new EthereumRpcError(5501, 'No active sessions'));
  }

  response.result = {
    sessionScopes: mergeScopes(
      caveat.value.requiredScopes,
      caveat.value.optionalScopes,
    ),
  };
  return end();
}
