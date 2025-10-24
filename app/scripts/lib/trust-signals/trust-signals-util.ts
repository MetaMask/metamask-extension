import { NetworkController } from '@metamask/network-controller';
import { JsonRpcRequest } from '@metamask/utils';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { PreferencesController } from '../../controllers/preferences-controller';
import {
  SupportedEVMChain,
  mapChainIdToSupportedEVMChain,
} from '../../../../shared/lib/trust-signals';

// isSecurityAlertsEnabledByUser is a function that checks if the security alerts are enabled in the preferences controller.
export function isSecurityAlertsEnabledByUser(
  preferencesController: PreferencesController,
) {
  const { securityAlertsEnabled } = preferencesController.state;
  return securityAlertsEnabled;
}

export function isEthSendTransaction(req: JsonRpcRequest): boolean {
  return req.method === MESSAGE_TYPE.ETH_SEND_TRANSACTION;
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

export function isEthSignTypedData(req: JsonRpcRequest): boolean {
  return (
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA ||
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1 ||
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 ||
    req.method === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  );
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

export function getChainId(
  networkController: NetworkController,
): SupportedEVMChain | undefined {
  const chainId = getProviderConfig({
    metamask: networkController.state,
  })?.chainId;
  if (!chainId) {
    throw new Error('Chain ID not found');
  }
  return mapChainIdToSupportedEVMChain(chainId);
}
