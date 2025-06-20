import { JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import { PhishingController } from '@metamask/phishing-controller';
import type { AppStateController } from '../../controllers/app-state-controller';
import { PreferencesController } from '../../controllers/preferences-controller';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
import { isSecurityAlertsAPIEnabled } from '../ppom/security-alerts-api';
import { scanAddressAndAddToCache } from './security-alerts-api';
import {
  hasValidTypedDataParams,
  isEthSignTypedData,
  isEthSendTransaction,
  hasValidTransactionParams,
  isEthAccounts,
  isSecurityAlertsEnabledByUser,
  isProdEnabled,
} from './trust-signals-util';

export function createTrustSignalsMiddleware(
  networkController: NetworkController,
  appStateController: AppStateController,
  phishingController: PhishingController,
  preferencesController: PreferencesController,
) {
  return async (
    req: JsonRpcRequest & { mainFrameOrigin?: string },
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
        handleEthSendTransaction(
          req,
          appStateController,
          networkController,
          phishingController,
        );
      } else if (isEthSignTypedData(req)) {
        handleEthSignTypedData(
          req,
          appStateController,
          networkController,
          phishingController,
        );
      } else if (isEthAccounts(req) && isProdEnabled()) {
        handleEthAccounts(req, phishingController);
      }
    } catch (error) {
      console.error('[createTrustSignalsMiddleware] error: ', error);
    } finally {
      next();
    }
  };
}

function handleEthSendTransaction(
  req: JsonRpcRequest & { mainFrameOrigin?: string },
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
) {
  if (req.mainFrameOrigin && isProdEnabled()) {
    phishingController.scanUrl(req.mainFrameOrigin).catch((error) => {
      console.error(
        '[createTrustSignalsMiddleware] error scanning url for transaction:',
        error,
      );
    });
  }

  if (!hasValidTransactionParams(req)) {
    return;
  }

  const { to } = req.params[0];
  scanAddressAndAddToCache(to, appStateController, networkController).catch(
    (error) => {
      console.error(
        '[createTrustSignalsMiddleware] error scanning address for transaction:',
        error,
      );
    },
  );
}

function handleEthSignTypedData(
  req: JsonRpcRequest & { mainFrameOrigin?: string },
  appStateController: AppStateController,
  networkController: NetworkController,
  phishingController: PhishingController,
) {
  if (req.mainFrameOrigin) {
    phishingController.scanUrl(req.mainFrameOrigin).catch((error) => {
      console.error(
        '[createTrustSignalsMiddleware] error scanning url for signature:',
        error,
      );
    });
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

  scanAddressAndAddToCache(
    verifyingContract,
    appStateController,
    networkController,
  ).catch((error) => {
    console.error(
      '[createTrustSignalsMiddleware] error scanning address for signature:',
      error,
    );
  });
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
