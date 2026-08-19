import { JsonRpcRequest, JsonRpcResponse, type Hex } from '@metamask/utils';
import {
  NetworkController,
  NetworkClientId,
} from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { PreferencesController } from '../../controllers/preferences-controller';
import {
  parseTypedDataMessage,
  parseApprovalTransactionData,
} from '../../../../shared/lib/transaction.utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
import { PRIMARY_TYPE_DELEGATION } from '../transaction/delegation';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';
import {
  hasValidTypedDataParams,
  isEthSignTypedData,
  isEthSendTransaction,
  hasValidTransactionParams,
  isSecurityAlertsEnabledByUser,
  isConnected,
  connectScreenHasBeenPrompted,
  isEip7715AdvancedPermissionsRequest,
} from './trust-signals-util';

export type TrustSignalsMiddlewareRequest = JsonRpcRequest & {
  origin?: string;
  requestUrl?: string;
  networkClientId: NetworkClientId;
};

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
  preferencesController: PreferencesController,
  getPermittedAccounts: (origin: string) => string[],
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
        !isSecurityAlertsEnabledByUser(preferencesController) ||
        !isSecurityAlertsAPIEnabled()
      ) {
        return;
      }

      if (isEthSendTransaction(req)) {
        handleEthSendTransaction(
          req,
          appStateController,
          networkController,
          phishingController,
        );
        scanUrl(req, phishingController);
      } else if (isEthSignTypedData(req)) {
        handleEthSignTypedData(
          req,
          appStateController,
          networkController,
          phishingController,
        );
        scanUrl(req, phishingController);
      } else if (isConnected(req, getPermittedAccounts)) {
        scanUrl(req, phishingController);
      } else if (connectScreenHasBeenPrompted(req)) {
        scanUrl(req, phishingController);
      } else if (isEip7715AdvancedPermissionsRequest(req)) {
        scanUrl(req, phishingController);
      }
    } catch (error) {
      console.error('[createTrustSignalsMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

function scanUrl(
  req: TrustSignalsMiddlewareRequest,
  phishingController: PhishingController,
) {
  const urlToScan = req.requestUrl ?? req.origin;

  if (urlToScan) {
    phishingController.scanUrl(urlToScan).catch((error) => {
      console.error('[createTrustSignalsMiddleware] error:', error);
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
 * @param appStateController - Provides the security alert response cache
 * @param phishingController - Controller providing scanAddress
 */
function scanAddressInBackground(
  address: string,
  logLabel: string,
  chainId: Hex,
  appStateController: AppStateController,
  phishingController: PhishingController,
) {
  scanAddressAndAddToCache(
    address,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    chainId,
    phishingController,
  ).catch((error) => {
    console.error(
      `[createTrustSignalsMiddleware] error scanning ${logLabel}:`,
      error,
    );
  });
}

function handleEthSendTransaction(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
) {
  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to, data } = req.params[0];

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  // Scan the 'to' address (contract address)
  scanAddressInBackground(
    to,
    'address for transaction',
    rawChainId,
    appStateController,
    phishingController,
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
        appStateController,
        phishingController,
      );
    }
  }
}

function handleEthSignTypedData(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
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

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  // Scan the verifying contract address (token contract)
  scanAddressInBackground(
    verifyingContract,
    'address for signature',
    rawChainId,
    appStateController,
    phishingController,
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
        appStateController,
        phishingController,
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
        appStateController,
        phishingController,
      );
    }
  }
}
