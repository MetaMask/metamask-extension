import { numberToHex } from '@metamask/utils';
import { Caip25EndowmentPermissionName } from './caip25permissions';

const paramsToArray = (params) => {
  const arr = [];
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      arr.push(params[key]);
    }
  }
  return arr;
};

export async function providerRequestHandler(
  request,
  _response,
  next,
  end,
  hooks,
) {
  const [scope, wrappedRequest] = Array.isArray(request.params)
    ? request.params
    : paramsToArray(request.params);

  if (!hooks.hasPermission(request.origin, Caip25EndowmentPermissionName)) {
    return end(new Error('missing CAIP-25 endowment'));
  }

  const chainId = scope.split(':')[1];

  if (!chainId) {
    return end(new Error('missing chainId'));
  }

  let networkClientId;
  networkClientId = hooks.findNetworkClientIdByChainId(
    numberToHex(parseInt(chainId, 10)),
  );

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
