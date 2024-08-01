import { providerErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { KnownCaipNamespace, mergeScopeObject, mergeScopes } from './scope';

export async function CaipPermissionAdapterMiddleware(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const { networkClientId, method } = request;

  const caveat = hooks.getCaveat(
    request.origin,
    Caip25EndowmentPermissionName,
    Caip25CaveatType,
  );
  if (!caveat?.value.isMultichainOrigin) {
    return next();
  }

  const { chainId } =
    hooks.getNetworkConfigurationByNetworkClientId(networkClientId);

  const scope = `eip155:${parseInt(chainId, 16)}`;

  const mergedScopes = mergeScopes(
    caveat.value.requiredScopes,
    caveat.value.optionalScopes,
  );

  const scopeObject = mergeScopeObject(
    mergedScopes[scope] || {
      methods: [],
      notifications: [],
    },
    mergedScopes[KnownCaipNamespace.Wallet],
  );

  if (!scopeObject.methods.includes(method)) {
    return end(providerErrors.unauthorized());
  }

  return next();
}
