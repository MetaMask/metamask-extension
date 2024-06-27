import { MESSAGE_TYPE } from '../../../../shared/constants/app';

import { Caip25EndowmentPermissionName } from './caip25permissions';

const providerRequest = {
  methodNames: [MESSAGE_TYPE.PROVIDER_AUTHORIZE],
  implementation: providerRequestHandler,
  hookNames: {
    hasPermission: true,
    getSelectedNetworkClientId: true,
  },
};
export default providerRequest;

async function providerRequestHandler(request, _response, next, end, hooks) {
  const { scope, request: wrappedRequest } = request.params;

  if (!hooks.hasPermission(request.origin, Caip25EndowmentPermissionName)) {
    return end(new Error('missing CAIP-25 endowment'));
  }

  let networkClientId;
  switch (scope) {
    case 'eip155:1':
      networkClientId = 'mainnet';
      break;
    case 'eip155:11155111':
      networkClientId = 'sepolia';
      break;
    default:
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
