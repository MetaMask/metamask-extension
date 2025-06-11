import { JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';
import {
  hasValidTypedDataParams,
  isEthSignTypedData,
  isEthSendTransaction,
  hasValidTransactionParams,
  isProdEnabled,
  isEthAccounts,
} from './trust-signals-util';

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
) {
  return async (
    req: JsonRpcRequest & { mainFrameOrigin?: string },
    _res: JsonRpcResponse,
    next: () => void,
  ) => {
    try {
      if (!isSecurityAlertsAPIEnabled() || !isProdEnabled()) {
        return;
      }

      if (isEthSendTransaction(req)) {
        await handleEthSendTransaction(
          req,
          appStateController,
          networkController,
        );
      } else if (isEthSignTypedData(req)) {
        await handleEthSignTypedData(
          req,
          appStateController,
          networkController,
        );
      } else if (isEthAccounts(req)) {
        handleEthAccounts(req, phishingController);
      }
    } catch (error) {
      console.error('[createTrustSignalsMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

async function handleEthSendTransaction(
  req: JsonRpcRequest,
  appStateController: AppStateController,
  networkController: NetworkController,
) {
  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to } = req.params[0];
  await scanAddressAndAddToCache(to, appStateController, networkController);
}

async function handleEthSignTypedData(
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

  await scanAddressAndAddToCache(
    verifyingContract,
    appStateController,
    networkController,
  );
}

function handleEthAccounts(
  req: JsonRpcRequest & { mainFrameOrigin?: string },
  phishingController: PhishingController,
) {
  if (req.mainFrameOrigin) {
    phishingController.scanUrl(req.mainFrameOrigin).catch((error) => {
      console.error('[createTrustSignalsMiddleware] error:', error);
    });
  }
}
