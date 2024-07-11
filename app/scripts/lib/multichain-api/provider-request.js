import {
  isCaipChainId,
  isCaipNamespace,
  numberToHex,
  parseCaipChainId,
} from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeScopes } from './scope';

// TODO: remove this when https://github.com/MetaMask/metamask-extension/pull/25708 is merged
const parseScopeString = (scopeString) => {
  if (isCaipNamespace(scopeString)) {
    return {
      namespace: scopeString,
    };
  }
  if (isCaipChainId(scopeString)) {
    return parseCaipChainId(scopeString);
  }

  return {};
};

export async function providerRequestHandler(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const { scope, request: wrappedRequest } = request.params;

  // maybe pull this stuff out into permission middleware
  const caveat = hooks.getCaveat(
    request.origin,
    Caip25EndowmentPermissionName,
    Caip25CaveatType,
  );
  if (!caveat) {
    return end(new Error('missing CAIP-25 endowment'));
  }

  const scopeObject = mergeScopes(
    caveat.value.requiredScopes,
    caveat.value.optionalScopes,
  )[scope];

  if (!scopeObject.methods.includes(wrappedRequest.method)) {
    return end(new Error('unauthorized (method missing in scopeObject)'));
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
      return end(new Error('unable to handle namespace'));
  }

  if (!networkClientId) {
    return end(new Error('failed to get network client for reference'));
  }

  Object.assign(request, {
    networkClientId,
    method: wrappedRequest.method,
    params: wrappedRequest.params,
  });
  return next();
}
