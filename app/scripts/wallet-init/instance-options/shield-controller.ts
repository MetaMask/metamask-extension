import type { WalletOptions } from '@metamask/wallet';
import { parseSignatureRequestMethod } from '@metamask/shield-controller';
import type { SignatureRequest } from '@metamask/signature-controller';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import type { JsonRpcRequest } from '@metamask/utils';
import { normalizeSignatureRequest as normalizePpomSignatureRequest } from '../../lib/ppom/ppom-util';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException } from '../../../../shared/lib/sentry';

type ShieldControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['shieldController']
>;

type ShieldApiServiceInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['shieldApiService']
>;

/**
 * Normalizes a signature request consistently with PPOM so that both systems
 * compute the same signature coverage ID.
 *
 * @param request - The signature request to normalize.
 * @returns The normalized signature request.
 */
function normalizeSignatureRequest(
  request: SignatureRequest,
): SignatureRequest {
  const signatureRequestMethod = parseSignatureRequestMethod(request);
  const isSignTypedDataV3V4 =
    request.version === SignTypedDataVersion.V3 ||
    request.version === SignTypedDataVersion.V4;
  const params = isSignTypedDataV3V4
    ? [request.messageParams.from, request.messageParams.data]
    : [request.messageParams.data, request.messageParams.from];
  const rpcRequest: JsonRpcRequest = {
    id: request.id,
    jsonrpc: '2.0',
    method: signatureRequestMethod,
    params,
  };
  const normalizedRequest = normalizePpomSignatureRequest(rpcRequest);

  if (normalizedRequest?.params && isSignTypedDataV3V4) {
    const requestParams = normalizedRequest.params as string[];
    request.messageParams.data = requestParams[1];
  }

  return request;
}

export function getShieldControllerInstanceOptions(): ShieldControllerInstanceOptions {
  return {
    normalizeSignatureRequest,
  };
}

export function getShieldApiServiceInstanceOptions(): ShieldApiServiceInstanceOptions {
  const { shieldEnv } = loadShieldConfig();

  return {
    env: shieldEnv,
    captureException,
  };
}
