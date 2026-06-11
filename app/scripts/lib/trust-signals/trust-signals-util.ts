import { NetworkController } from '@metamask/network-controller';
import { JsonRpcRequest } from '@metamask/utils';
import { getProviderConfig } from '../../../../shared/lib/selectors/networks';
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

// Private recursive helper — walks the EIP-712 types map from a given type name
// collecting all field values whose declared type is 'address'.
function walkEip712Type(
  types: Record<string, { name: string; type: string }[]>,
  typeName: string,
  value: Record<string, unknown>,
  visited: Set<string>,
): string[] {
  if (visited.has(typeName)) {
    return [];
  }
  const fields = types[typeName];
  if (!fields) {
    return [];
  }
  const path = new Set(visited);
  path.add(typeName);
  const addresses: string[] = [];
  for (const field of fields) {
    const fieldValue = value[field.name];
    const isArrayType = field.type.includes('[');
    const baseType = isArrayType ? field.type.split('[')[0] : field.type;
    if (baseType === 'address') {
      if (isArrayType && Array.isArray(fieldValue)) {
        for (const item of fieldValue) {
          if (typeof item === 'string' && item) {
            addresses.push(item);
          }
        }
      } else if (!isArrayType && typeof fieldValue === 'string' && fieldValue) {
        addresses.push(fieldValue);
      }
    } else if (baseType in types) {
      if (isArrayType && Array.isArray(fieldValue)) {
        for (const item of fieldValue) {
          if (typeof item === 'object' && item !== null) {
            addresses.push(
              ...walkEip712Type(
                types,
                baseType,
                item as Record<string, unknown>,
                path,
              ),
            );
          }
        }
      } else if (
        !isArrayType &&
        typeof fieldValue === 'object' &&
        fieldValue !== null
      ) {
        addresses.push(
          ...walkEip712Type(
            types,
            baseType,
            fieldValue as Record<string, unknown>,
            path,
          ),
        );
      }
    }
  }
  return addresses;
}

/**
 * Traverses an EIP-712 typed-data message from its primaryType through all
 * nested struct definitions in the types map, collecting every field value
 * whose declared type is 'address' (including address[] arrays and address
 * fields nested inside struct arrays).
 * @param types
 * @param primaryType
 * @param message
 */
export function extractEip712AddressValues(
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string,
  message: Record<string, unknown>,
): string[] {
  return walkEip712Type(types, primaryType, message, new Set<string>());
}
