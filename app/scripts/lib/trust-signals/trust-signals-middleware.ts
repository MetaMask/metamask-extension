import type { Messenger } from '@metamask/messenger';
import type {
  NetworkClientId,
  NetworkControllerGetNetworkConfigurationByNetworkClientIdAction,
} from '@metamask/network-controller';
import type { PermissionControllerHasPermissionAction } from '@metamask/permission-controller';
import type {
  PhishingControllerScanAddressAction,
  PhishingControllerScanUrlAction,
} from '@metamask/phishing-controller';
import { JsonRpcRequest, JsonRpcResponse, type Hex } from '@metamask/utils';

import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
import {
  parseApprovalTransactionData,
  parseTypedDataMessage,
} from '../../../../shared/lib/transaction.utils';
import {
  AppStateControllerAddAddressSecurityAlertResponseAction,
  AppStateControllerGetAddressSecurityAlertResponseAction,
} from '../../controllers/app-state-controller-method-action-types';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { PRIMARY_TYPE_DELEGATION } from '../transaction/delegation';
import { scanAddressAndAddToCache } from './security-alerts-api';
import {
  hasValidTypedDataParams,
  isEthSignTypedData,
  isEthSendTransaction,
  hasValidTransactionParams,
  isSecurityAlertsEnabledByUser,
} from './trust-signals-util';

export type TrustSignalsMiddlewareRequest = JsonRpcRequest & {
  origin?: string;
  requestUrl?: string;
  networkClientId: NetworkClientId;
};

export type TrustSignalsMessengerActions =
  | PreferencesControllerGetStateAction
  | NetworkControllerGetNetworkConfigurationByNetworkClientIdAction
  | AppStateControllerGetAddressSecurityAlertResponseAction
  | AppStateControllerAddAddressSecurityAlertResponseAction
  | PhishingControllerScanAddressAction
  | PhishingControllerScanUrlAction
  | PermissionControllerHasPermissionAction;

export type TrustSignalsMessenger = Messenger<
  'TrustSignals',
  TrustSignalsMessengerActions
>;

/**
 * Scan the requesting origin. Kept separate from address scanning because the
 * two need different positions in the Multichain API stack: the origin scan has
 * to run above the session handlers, which answer `wallet_createSession` and
 * `wallet_getSession` without passing them down.
 *
 * @param messenger - Restricted messenger for preferences and URL scanning
 * @param shouldScanOrigin - Per-transport gate, since no method name is shared
 * @param requestUrl - Full sender URL, preferred over the bare origin
 */
export function createOriginScanMiddleware(
  messenger: TrustSignalsMessenger,
  shouldScanOrigin: (req: TrustSignalsMiddlewareRequest) => boolean,
  requestUrl?: string,
) {
  return async (
    req: TrustSignalsMiddlewareRequest,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      req.requestUrl = requestUrl;

      if (
        !isSecurityAlertsEnabledByUser(messenger) ||
        !isSecurityAlertsAPIEnabled()
      ) {
        return;
      }

      if (shouldScanOrigin(req)) {
        scanUrl(req, messenger);
      }
    } catch (error) {
      console.error('[createOriginScanMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

/**
 * Scan the addresses a request touches. Gated on the EIP-1193 method name on
 * both transports, since Multichain API requests reach this point already
 * unwrapped.
 *
 * @param messenger - Restricted messenger for chain lookup, cache, and scans
 */
export function createAddressScanMiddleware(messenger: TrustSignalsMessenger) {
  return async (
    req: TrustSignalsMiddlewareRequest,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      if (
        !isSecurityAlertsEnabledByUser(messenger) ||
        !isSecurityAlertsAPIEnabled()
      ) {
        return;
      }

      if (isEthSendTransaction(req)) {
        handleEthSendTransaction(req, messenger);
      } else if (isEthSignTypedData(req)) {
        handleEthSignTypedData(req, messenger);
      }
    } catch (error) {
      console.error('[createAddressScanMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

function scanUrl(
  req: TrustSignalsMiddlewareRequest,
  messenger: TrustSignalsMessenger,
) {
  const urlToScan = req.requestUrl ?? req.origin;

  if (urlToScan) {
    messenger.call('PhishingController:scanUrl', urlToScan).catch((error) => {
      console.error('[createOriginScanMiddleware] error:', error);
    });
  }
}

/**
 * Fire-and-forget an address scan, logging (rather than propagating) any
 * failure so one rejected scan cannot affect the middleware pipeline.
 *
 * @param address - The address to scan
 * @param logLabel - Describes the address's role in the error log message
 * @param chainId - The hex chainId of the chain the address exists on
 * @param messenger - Provides the security alert cache and address scan
 */
function scanAddressInBackground(
  address: string,
  logLabel: string,
  chainId: Hex,
  messenger: TrustSignalsMessenger,
) {
  scanAddressAndAddToCache(
    address,
    (cacheKey) =>
      messenger.call(
        'AppStateController:getAddressSecurityAlertResponse',
        cacheKey,
      ),
    (cacheKey, response) =>
      messenger.call(
        'AppStateController:addAddressSecurityAlertResponse',
        cacheKey,
        response,
      ),
    chainId,
    {
      scanAddress: (scanChainId, scanAddress) =>
        messenger.call(
          'PhishingController:scanAddress',
          scanChainId,
          scanAddress,
        ),
    },
  ).catch((error) => {
    console.error(
      `[createAddressScanMiddleware] error scanning ${logLabel}:`,
      error,
    );
  });
}

function getChainIdForRequest(
  req: TrustSignalsMiddlewareRequest,
  messenger: TrustSignalsMessenger,
): Hex | undefined {
  const { chainId: rawChainId } =
    messenger.call(
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return undefined;
  }

  return rawChainId;
}

function handleEthSendTransaction(
  req: TrustSignalsMiddlewareRequest,
  messenger: TrustSignalsMessenger,
) {
  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to, data } = req.params[0];
  const rawChainId = getChainIdForRequest(req, messenger);

  if (!rawChainId) {
    return;
  }

  // Scan the 'to' address (contract address)
  scanAddressInBackground(
    to,
    'address for transaction',
    rawChainId,
    messenger,
  );

  // If this is an approval transaction, also scan the spender address
  if (data && typeof data === 'string') {
    const approvalData = parseApprovalTransactionData(data as `0x${string}`);
    const spenderAddress = approvalData?.spender;
    if (spenderAddress) {
      scanAddressInBackground(
        spenderAddress,
        'spender address for approval',
        rawChainId,
        messenger,
      );
    }
  }
}

function handleEthSignTypedData(
  req: TrustSignalsMiddlewareRequest,
  messenger: TrustSignalsMessenger,
) {
  if (
    req.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3 &&
    req.method !== MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4
  ) {
    return;
  }

  if (!hasValidTypedDataParams(req)) {
    return;
  }

  const typedDataMessage = parseTypedDataMessage(
    typeof req.params[1] === 'string'
      ? req.params[1]
      : JSON.stringify(req.params[1]),
  );
  const verifyingContract = typedDataMessage.domain?.verifyingContract;
  if (!verifyingContract) {
    return;
  }

  const rawChainId = getChainIdForRequest(req, messenger);

  if (!rawChainId) {
    return;
  }

  // Scan the verifying contract address (token contract)
  scanAddressInBackground(
    verifyingContract,
    'address for signature',
    rawChainId,
    messenger,
  );

  const { primaryType }: { primaryType: string } = typedDataMessage;
  if (!primaryType) {
    return;
  }

  // If this is a permit signature, also scan the spender address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (PRIMARY_TYPES_PERMIT.includes(primaryType as any)) {
    const spenderAddress = typedDataMessage.message?.spender;
    if (spenderAddress) {
      scanAddressInBackground(
        spenderAddress,
        'spender address for permit',
        rawChainId,
        messenger,
      );
    }
  }

  // If this is a delegation signature, scan the delegate address
  if (primaryType === PRIMARY_TYPE_DELEGATION) {
    const delegateAddress = typedDataMessage.message?.delegate;
    if (delegateAddress) {
      scanAddressInBackground(
        delegateAddress,
        'delegate address for delegation',
        rawChainId,
        messenger,
      );
    }
  }
}
