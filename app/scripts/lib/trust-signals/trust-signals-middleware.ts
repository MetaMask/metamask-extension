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
} from '../../../../shared/modules/transaction.utils';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
import { PRIMARY_TYPE_DELEGATION } from '../transaction/delegation';
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
} from './trust-signals-util';

export type TrustSignalsMiddlewareRequest = JsonRpcRequest & {
  origin?: string;
  networkClientId: NetworkClientId;
};

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
  preferencesController: PreferencesController,
  getPermittedAccounts: (origin: string) => string[],
) {
  return async (
    req: TrustSignalsMiddlewareRequest,
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
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
  if (req.origin) {
    phishingController.scanUrl(req.origin).catch((error) => {
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

  const { primaryType }: { primaryType: string } = typedDataMessage;
  if (!primaryType) {
    return;
  }

  // If this is a permit signature, also scan the spender address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (PRIMARY_TYPES_PERMIT.includes(primaryType as any)) {
    const spenderAddress = typedDataMessage.message?.spender;
    if (spenderAddress) {
      scanAddressAndAddToCache(
        spenderAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        supportedEVMChain,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning spender address for permit:',
          error,
        );
      });
    }
  }

  // If this is a delegation signature, scan the delegate address
  if (primaryType === PRIMARY_TYPE_DELEGATION) {
    const delegateAddress = typedDataMessage.message?.delegate;
    if (delegateAddress) {
      scanAddressAndAddToCache(
        delegateAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        supportedEVMChain,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning delegate address for delegation:',
          error,
        );
      });
    }
  }
}
