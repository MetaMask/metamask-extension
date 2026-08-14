import { JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
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
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { mapChainIdToSupportedEVMChain } from '../../../../shared/lib/trust-signals';
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
  extractEip712AddressValues,
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
        handleEthSendTransaction(req, appStateController, networkController);
        scanUrl(req, phishingController);
      } else if (isEthSignTypedData(req)) {
        handleEthSignTypedData(req, appStateController, networkController);
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

function handleEthSendTransaction(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
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

  const supportedEVMChain = mapChainIdToSupportedEVMChain(rawChainId);
  if (!supportedEVMChain) {
    console.error('Unsupported chainId:', rawChainId);
    return;
  }

  // Scan the 'to' address (contract address)
  scanAddressAndAddToCache(
    to,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    supportedEVMChain,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for transaction:',
      error,
    );
  });

  // If this is an approval transaction, also scan the spender address
  if (data && typeof data === 'string') {
    const approvalData = parseApprovalTransactionData(data as `0x${string}`);
    const spenderAddress = approvalData?.spender;
    if (spenderAddress) {
      scanAddressAndAddToCache(
        spenderAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        supportedEVMChain,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning spender address for approval:',
          error,
        );
      });
    }
  }
}

function handleEthSignTypedData(
  req: TrustSignalsMiddlewareRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
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

  const supportedEVMChain = mapChainIdToSupportedEVMChain(rawChainId);
  if (!supportedEVMChain) {
    console.error('Unsupported chainId:', rawChainId);
    return;
  }

  // Scan the verifying contract address (token contract)
  scanAddressAndAddToCache(
    verifyingContract,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    supportedEVMChain,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for signature:',
      error,
    );
  });

  const {
    primaryType,
    types,
    message,
  }: {
    primaryType?: string;
    types?: Record<string, { name: string; type: string }[]>;
    message?: Record<string, unknown>;
  } = typedDataMessage;

  if (!primaryType) {
    return;
  }

  if (types && message) {
    const addressValues = extractEip712AddressValues(
      types,
      primaryType,
      message,
    );
    for (const address of addressValues) {
      scanAddressAndAddToCache(
        address,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        supportedEVMChain,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning address in typed data message:',
          error,
        );
      });
    }
  }
}
