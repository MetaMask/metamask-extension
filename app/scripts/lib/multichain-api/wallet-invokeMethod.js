import { numberToHex } from '@metamask/utils';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeScopes, parseScopeString } from './scope';

export async function walletInvokeMethodHandler(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const { scope, request: wrappedRequest } = request.params;

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
  if (!caveat?.value?.isMultichainOrigin) {
    return end(providerErrors.unauthorized());
  }

  const scopeObject = mergeScopes(
    caveat.value.requiredScopes,
    caveat.value.optionalScopes,
  )[scope];

  if (!scopeObject?.methods?.includes(wrappedRequest.method)) {
    return end(providerErrors.unauthorized());
  }

  const { namespace, reference } = parseScopeString(scope);

  let networkClientId;
  switch (namespace) {
    case 'wallet':
      networkClientId = hooks.getSelectedNetworkClientId();
      break;
    case 'eip155':
      if (reference) {
        networkClientId = hooks.findNetworkClientIdByChainId(
          numberToHex(parseInt(reference, 10)),
        );
      }
      break;
    default:
      console.error(
        'failed to resolve namespace for wallet_invokeMethod',
        request,
      );
      return end(rpcErrors.internal());
  }

  if (!networkClientId) {
    console.error(
      'failed to resolve network client for wallet_invokeMethod',
      request,
    );
    return end(rpcErrors.internal());
  }

  Object.assign(request, {
    scope,
    networkClientId,
    method: wrappedRequest.method,
    params: wrappedRequest.params,
  });
  return next();
}
