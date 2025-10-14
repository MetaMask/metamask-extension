import { JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import {
  NetworkController,
  NetworkClientId,
} from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { PreferencesController } from '../../controllers/preferences-controller';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
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

  const { to } = req.params[0];

  const { chainId: rawChainId } =
    networkController.getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    ) ?? {};

  if (!rawChainId) {
    console.error('ChainID not found for networkClientId');
    return;
  }

  const chainId = mapChainIdToSupportedEVMChain(rawChainId);
  if (!chainId) {
    console.error('Unsupported chainId:', rawChainId);
    return;
  }

  scanAddressAndAddToCache(
    to,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    chainId,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for transaction:',
      error,
    );
  });
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

  const chainId = mapChainIdToSupportedEVMChain(rawChainId);
  if (!chainId) {
    console.error('Unsupported chainId:', rawChainId);
    return;
  }

  scanAddressAndAddToCache(
    verifyingContract,
    appStateController.getAddressSecurityAlertResponse,
    appStateController.addAddressSecurityAlertResponse,
    chainId,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for signature:',
      error,
    );
  });
}
