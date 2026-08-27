import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';
import { JsonRpcRequest } from '@metamask/utils';

import { MESSAGE_TYPE } from '../../../../shared/constants/app';

type PreferencesStateMessenger = {
  call: (action: 'PreferencesController:getState') => {
    securityAlertsEnabled: boolean;
  };
};

export type TrustSignalsPermissionMessenger = {
  call: (
    action: 'PermissionController:hasPermission',
    origin: string,
    permissionName: string,
  ) => boolean;
};

export function isSecurityAlertsEnabledByUser(
  messenger: PreferencesStateMessenger,
) {
  const { securityAlertsEnabled } = messenger.call(
    'PreferencesController:getState',
  );
  return securityAlertsEnabled;
}

export function isEthSendTransactionMethod(method: string): boolean {
  return method === MESSAGE_TYPE.ETH_SEND_TRANSACTION;
}

export function isEthSendTransaction(req: JsonRpcRequest): boolean {
  return isEthSendTransactionMethod(req.method);
}

export function isEip7715AdvancedPermissionsRequest(
  req: JsonRpcRequest,
): boolean {
  return (
    req.method === MESSAGE_TYPE.WALLET_REQUEST_EXECUTION_PERMISSIONS ||
    req.method === MESSAGE_TYPE.WALLET_GET_SUPPORTED_EXECUTION_PERMISSIONS ||
    req.method === MESSAGE_TYPE.WALLET_GET_GRANTED_EXECUTION_PERMISSIONS
  );
}

export function hasValidTransactionParams(
  req: JsonRpcRequest,
): req is JsonRpcRequest & {
  params: [
    {
      to: string;
      chainId: string;
      [key: string]: unknown;
    },
    ...unknown[],
  ];
} {
  if (!('params' in req) || !req.params) {
    return false;
  }

  if (!Array.isArray(req.params) || req.params.length === 0) {
    return false;
  }

  const firstParam = req.params[0];

  return (
    typeof firstParam === 'object' && firstParam !== null && 'to' in firstParam
  );
}

export function isEthSignTypedDataMethod(method: string): boolean {
  return (
    method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA ||
    method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1 ||
    method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 ||
    method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  );
}

export function isEthSignTypedData(req: JsonRpcRequest): boolean {
  return isEthSignTypedDataMethod(req.method);
}

export function isConnected(
  req: JsonRpcRequest & { origin?: string },
  messenger: TrustSignalsPermissionMessenger,
): boolean {
  if (!req.origin || req.method !== MESSAGE_TYPE.ETH_ACCOUNTS) {
    return false;
  }
  return messenger.call(
    'PermissionController:hasPermission',
    req.origin,
    Caip25EndowmentPermissionName,
  );
}

export function connectScreenHasBeenPrompted(req: JsonRpcRequest): boolean {
  return (
    req.method === MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS ||
    req.method === MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS
  );
}

export function hasValidTypedDataParams(
  req: JsonRpcRequest,
): req is JsonRpcRequest & {
  params: [unknown, string | object];
} {
  if (!('params' in req) || !req.params) {
    return false;
  }

  if (!Array.isArray(req.params) || req.params.length < 2) {
    return false;
  }

  return req.params[1] !== undefined && req.params[1] !== null;
}

export function isWalletCreateSession(req: JsonRpcRequest): boolean {
  return req.method === MESSAGE_TYPE.WALLET_CREATE_SESSION;
}

/**
 * The Multichain API analogue of `isConnected`. `wallet_getSession` reads the
 * origin's CAIP-25 permission without prompting, exactly as `eth_accounts` reads
 * permitted accounts, so an origin that already holds one is a connected read.
 *
 * @param req - The request being inspected
 * @param messenger - Used to check for a CAIP-25 permission
 */
export function isCaipConnected(
  req: JsonRpcRequest & { origin?: string },
  messenger: TrustSignalsPermissionMessenger,
): boolean {
  if (!req.origin || req.method !== MESSAGE_TYPE.WALLET_GET_SESSION) {
    return false;
  }
  return messenger.call(
    'PermissionController:hasPermission',
    req.origin,
    Caip25EndowmentPermissionName,
  );
}

/**
 * Read the inner method of a `wallet_invokeMethod` request. Returns undefined
 * for any other method, or when the wrapped request is malformed.
 *
 * @param req - The request being inspected
 */
export function getWrappedRequestMethod(
  req: JsonRpcRequest,
): string | undefined {
  if (req.method !== MESSAGE_TYPE.WALLET_INVOKE_METHOD) {
    return undefined;
  }

  const params = req.params as { request?: { method?: unknown } } | undefined;
  const wrappedMethod = params?.request?.method;

  return typeof wrappedMethod === 'string' ? wrappedMethod : undefined;
}

/**
 * Build the EIP-1193 gate for origin scanning.
 *
 * @param messenger - Used to check whether the origin already holds a session
 */
export function createEip1193OriginScanGate(
  messenger: TrustSignalsPermissionMessenger,
) {
  return (req: JsonRpcRequest & { origin?: string }): boolean =>
    isEthSendTransaction(req) ||
    isEthSignTypedData(req) ||
    isConnected(req, messenger) ||
    connectScreenHasBeenPrompted(req) ||
    isEip7715AdvancedPermissionsRequest(req);
}

/**
 * Build the Multichain API gate for origin scanning. Authored independently of
 * the EIP-1193 gate rather than derived from it, since none of those method
 * names exist on this transport.
 *
 * Action requests are matched on the method wrapped inside `wallet_invokeMethod`
 * rather than on `wallet_invokeMethod` itself. A granted `eip155` scope permits
 * nearly the entire RPC surface, so gating on the outer method alone would scan
 * the origin on routine polling reads.
 *
 * @param messenger - Used to check whether the origin already holds a session
 */
export function createCaipOriginScanGate(
  messenger: TrustSignalsPermissionMessenger,
) {
  return (req: JsonRpcRequest & { origin?: string }): boolean => {
    if (isWalletCreateSession(req) || isCaipConnected(req, messenger)) {
      return true;
    }

    const wrappedMethod = getWrappedRequestMethod(req);

    return Boolean(
      wrappedMethod &&
      (isEthSendTransactionMethod(wrappedMethod) ||
        isEthSignTypedDataMethod(wrappedMethod)),
    );
  };
}
