import { Caip25EndowmentPermissionName } from './caip25permissions';

export async function providerRequestHandler(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const { scope, request: wrappedRequest } = request.params;

  if (!hooks.hasPermission(request.origin, Caip25EndowmentPermissionName)) {
    return end(new Error('missing CAIP-25 endowment'));
  }

  const chainId = scope.split(':')[1];

  if (!chainId) {
    return end(new Error('missing chainId'));
  }

  let networkClientId;
  networkClientId = hooks.findNetworkClientIdByChainId(chainId);

  if (!networkClientId) {
    networkClientId = hooks.getSelectedNetworkClientId();
  }

  console.log(
    'provider_request incoming wrapped',
    JSON.stringify(request, null, 2),
  );
  Object.assign(request, {
    networkClientId,
    method: wrappedRequest.method,
    params: wrappedRequest.params,
  });
  console.log('provider_request unwrapped', JSON.stringify(request, null, 2));
  return next();
}
