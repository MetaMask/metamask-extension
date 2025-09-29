import { JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { PreferencesController } from '../../controllers/preferences-controller';
import {
  parseTypedDataMessage,
  parseApprovalTransactionData,
} from '../../../../shared/modules/transaction.utils';
import { PRIMARY_TYPES_PERMIT } from '../../../../shared/constants/signatures';
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
  getChainId,
  isApprovalTransaction,
} from './trust-signals-util';
import { SupportedEVMChain } from './types';

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
  preferencesController: PreferencesController,
  getPermittedAccounts: (origin: string) => string[],
) {
  return async (
    req: JsonRpcRequest & { origin?: string },
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
  req: JsonRpcRequest & { origin?: string },
  phishingController: PhishingController,
) {
  if (req.origin) {
    phishingController.scanUrl(req.origin).catch((error) => {
      console.error('[createTrustSignalsMiddleware] error:', error);
    });
  }
}

function handleEthSendTransaction(
  req: JsonRpcRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
) {
  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to, data } = req.params[0];
  let chainId: SupportedEVMChain | undefined;
  try {
    chainId = getChainId(networkController);
  } catch (error) {
    console.error(
      '[createTrustSignalsMiddleware] error getting chainId:',
      error,
    );
    return;
  }

  if (!chainId) {
    return;
  }

  // Scan the 'to' address (contract address)
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

  // If this is an approval transaction, also scan the spender address
  if (isApprovalTransaction(req) && data && typeof data === 'string') {
    const approvalData = parseApprovalTransactionData(data as `0x${string}`);
    const spenderAddress = approvalData?.spender;
    if (spenderAddress) {
      scanAddressAndAddToCache(
        spenderAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        chainId,
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
  req: JsonRpcRequest,
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

  let chainId: SupportedEVMChain | undefined;
  try {
    chainId = getChainId(networkController);
  } catch (error) {
    console.error(
      '[createTrustSignalsMiddleware] error getting chainId:',
      error,
    );
    return;
  }

  if (!chainId) {
    return;
  }

  // Scan the verifying contract address (token contract)
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

  const { primaryType }: { primaryType: string } = typedDataMessage;
  if (!primaryType) {
    return;
  }

  // If this is a permit signature, also scan the spender address
  // Use the same logic as isPermitSignatureRequest but inline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (PRIMARY_TYPES_PERMIT.includes(primaryType as any)) {
    const spenderAddress = typedDataMessage.message?.spender;
    if (spenderAddress) {
      scanAddressAndAddToCache(
        spenderAddress,
        appStateController.getAddressSecurityAlertResponse,
        appStateController.addAddressSecurityAlertResponse,
        chainId,
      ).catch((error) => {
        console.error(
          '[createTrustSignalsMiddleware] error scanning spender address for permit:',
          error,
        );
      });
    }
  }
}
