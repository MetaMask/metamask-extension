import { providerErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../caip25permissions';
import { mergeScopes } from '../scope';

export async function CaipPermissionAdapterMiddleware(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const { networkClientId, method } = request;

  let caveat;
  try {
    caveat = hooks.getCaveat(
      request.origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
    );
  } catch (err) {
    // noop
  }
  if (!caveat?.value?.isMultichainOrigin) {
    return next();
  }

  const { chainId } =
    hooks.getNetworkConfigurationByNetworkClientId(networkClientId);

  const scope = `eip155:${parseInt(chainId, 16)}`;

  const scopesObject = mergeScopes(
    caveat.value.requiredScopes,
    caveat.value.optionalScopes,
  );

  if (
    !scopesObject[scope]?.methods?.includes(method) &&
    !scopesObject['wallet:eip155']?.methods?.includes(method) &&
    !scopesObject.wallet?.methods?.includes(method)
  ) {
    return end(providerErrors.unauthorized());
  }

  return next();
}
