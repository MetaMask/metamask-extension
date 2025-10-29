import {
  parseSignatureRequestMethod,
  ShieldController,
  ShieldControllerMessenger,
  ShieldRemoteBackend,
} from '@metamask/shield-controller';
import { SignatureRequest } from '@metamask/signature-controller';
import { JsonRpcRequest } from '@metamask/utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { ControllerInitFunction } from '../types';
import { ShieldControllerInitMessenger } from '../messengers/shield/shield-controller-messenger';
import { normalizeSignatureRequest as ppomNormalizeSignatureRequest } from '../../lib/ppom/ppom-util';

/**
 * Normalizes the signature request before getting the signature coverage results in the Shield controller.
 * This is done to ensure that the signature request is normalized as the same as the PPOM request so that the signature coverage id computation is consistent.
 *
 * @param request - The signature request to normalize.
 * @returns The normalized signature request.
 */
const normalizeSignatureRequest = (
  request: SignatureRequest,
): SignatureRequest => {
  const signatureRequestMethod = parseSignatureRequestMethod(request);
  const isSignTypedDataV3V4 =
    request.version === SignTypedDataVersion.V3 ||
    request.version === SignTypedDataVersion.V4;

  // NOTE: intentionally using the `normalizedSignatureRequest` from PPOM-utils so that the shield request is normalized as the same as the PPOM request
  // if anything changes in the PPOM-utils, it will be reflected here as well
  const params = isSignTypedDataV3V4
    ? [request.messageParams.from, request.messageParams.data]
    : [request.messageParams.data, request.messageParams.from];
  const rpcRequest: JsonRpcRequest = {
    id: request.id,
    jsonrpc: '2.0',
    method: signatureRequestMethod,
    params,
  };
  const normalizedPPOMRequest = ppomNormalizeSignatureRequest(rpcRequest);
  if (normalizedPPOMRequest?.params && isSignTypedDataV3V4) {
    const requestParams = normalizedPPOMRequest.params as string[];
    request.messageParams.data = requestParams[1];
  }

  return request;
};

export const ShieldControllerInit: ControllerInitFunction<
  ShieldController,
  ShieldControllerMessenger,
  ShieldControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  const baseUrl =
    process.env.SHIELD_RULE_ENGINE_URL ??
    'https://shield-rule-engine.dev-api.cx.metamask.io';

  const getAccessToken = () =>
    initMessenger.call('AuthenticationController:getBearerToken');

  const controller = new ShieldController({
    messenger: controllerMessenger,
    state: persistedState.ShieldController,
    normalizeSignatureRequest,
    backend: new ShieldRemoteBackend({
      getAccessToken,
      fetch: (input, init) => {
        // From https://github.com/MetaMask/metamask-extension/pull/35588/
        // Without wrapping fetch, the requests are not sent as expected. More
        // investigation is needed.
        return fetch(input, init);
      },
      baseUrl,
    }),
  });

  return {
    controller,
  };
};
