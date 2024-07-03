import { numberToHex, parseCaipChainId } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeFlattenedScopes } from './scope';

export async function providerRequestHandler(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const { scope, request: wrappedRequest } = request.params;

  const caveat = hooks.getCaveat(
    request.origin,
    Caip25EndowmentPermissionName,
    Caip25CaveatType,
  );
  if (!caveat) {
    return end(new Error('missing CAIP-25 endowment'));
  }

  const scopeObject = mergeFlattenedScopes(
    caveat.value.requiredScopes,
    caveat.value.optionalScopes,
  )[scope];

  if (!scopeObject) {
    return end(new Error('unauthorized (scopeObject missing)'));
  }

  if (!scopeObject.methods.includes(wrappedRequest.method)) {
    return end(new Error('unauthorized (method missing in scopeObject)'));
  }

  let reference;
  try {
    reference = parseCaipChainId(scope).reference;
  } catch (err) {
    return end(new Error('invalid caipChainId')); // should be invalid params error
  }

  let networkClientId;
  networkClientId = hooks.findNetworkClientIdByChainId(
    numberToHex(parseInt(reference, 10)),
  );

  if (!networkClientId) {
    networkClientId = hooks.getSelectedNetworkClientId();
  }

  Object.assign(request, {
    networkClientId,
    method: wrappedRequest.method,
    params: wrappedRequest.params,
  });
  return next();
}
