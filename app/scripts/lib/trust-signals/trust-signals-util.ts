import { JsonRpcRequest } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { PreferencesController } from '../../controllers/preferences-controller';

// isSecurityAlertsEnabledByUser is a function that checks if the security alerts are enabled in the preferences controller.
export function isSecurityAlertsEnabledByUser(
  preferencesController: PreferencesController,
) {
  const { securityAlertsEnabled } = preferencesController.state;
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

export function isWalletSendCallsMethod(method: string): boolean {
  return method === MESSAGE_TYPE.WALLET_SEND_CALLS;
}

export function isWalletSendCalls(req: JsonRpcRequest): boolean {
  return isWalletSendCallsMethod(req.method);
}

export function hasValidSendCallsParams(
  req: JsonRpcRequest,
): req is JsonRpcRequest & {
  params: [
    {
      calls: unknown[];
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

  // Individual call entries are deliberately not validated here: the caller
  // skips malformed entries per call, so one bad entry cannot suppress
  // scanning of the well-formed ones.
  return (
    typeof firstParam === 'object' &&
    firstParam !== null &&
    'calls' in firstParam &&
    Array.isArray(firstParam.calls)
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
  getPermittedAccounts: (origin: string) => string[],
): boolean {
  if (!req.origin || req.method !== MESSAGE_TYPE.ETH_ACCOUNTS) {
    return false;
  }
  const permittedAccounts = getPermittedAccounts(req.origin);
  return Array.isArray(permittedAccounts) && permittedAccounts.length > 0;
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
 * @param hasCaip25Permission - Whether the origin holds a CAIP-25 permission
 */
export function isCaipConnected(
  req: JsonRpcRequest & { origin?: string },
  hasCaip25Permission: (origin: string) => boolean,
): boolean {
  if (!req.origin || req.method !== MESSAGE_TYPE.WALLET_GET_SESSION) {
    return false;
  }
  return hasCaip25Permission(req.origin);
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
 * @param getPermittedAccounts - Returns the accounts an origin may use
 */
export function createEip1193OriginScanGate(
  getPermittedAccounts: (origin: string) => string[],
) {
  return (req: JsonRpcRequest & { origin?: string }): boolean =>
    isEthSendTransaction(req) ||
    isWalletSendCalls(req) ||
    isEthSignTypedData(req) ||
    isConnected(req, getPermittedAccounts) ||
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
 * @param hasCaip25Permission - Whether the origin holds a CAIP-25 permission
 */
export function createCaipOriginScanGate(
  hasCaip25Permission: (origin: string) => boolean,
) {
  return (req: JsonRpcRequest & { origin?: string }): boolean => {
    if (
      isWalletCreateSession(req) ||
      isCaipConnected(req, hasCaip25Permission)
    ) {
      return true;
    }

    const wrappedMethod = getWrappedRequestMethod(req);

    // No EIP-7715 case here, unlike the EIP-1193 gate: those methods are absent
    // from every CAIP-25 scope's method list, so `wallet_invokeMethod` rejects
    // them as unauthorized before this gate ever sees them. Add them here if a
    // scope ever grants them.
    return Boolean(
      wrappedMethod &&
      (isEthSendTransactionMethod(wrappedMethod) ||
        isEthSignTypedDataMethod(wrappedMethod) ||
        isWalletSendCallsMethod(wrappedMethod)),
    );
  };
}
