import { PPOM } from '@blockaid/ppom_release';
import { PPOMController } from '@metamask/ppom-validator';
import { NetworkController } from '@metamask/network-controller';
import { v4 as uuid } from 'uuid';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SIGNING_METHODS } from '../../../../shared/constants/transaction';
import { PreferencesController } from '../../controllers/preferences';
import { SecurityAlertResponse } from '../transaction/util';
import { normalizePPOMRequest } from './ppom-util';

const { sentry } = global as any;

const CONFIRMATION_METHODS = Object.freeze([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  ...SIGNING_METHODS,
]);

export const SUPPORTED_CHAIN_IDS: string[] = [
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.BASE,
  CHAIN_IDS.BSC,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.SEPOLIA,
];

/**
 * Middleware function that handles JSON RPC requests.
 * This function will be called for every JSON RPC request.
 * It will call the PPOM to check if the request is malicious or benign.
 * If the request is benign, it will be forwarded to the next middleware.
 * If the request is malicious or warning, it will trigger the PPOM alert dialog,
 * after the user has confirmed or rejected the request,
 * the request will be forwarded to the next middleware, together with the PPOM response.
 *
 * @param ppomController - Instance of PPOMController.
 * @param preferencesController - Instance of PreferenceController.
 * @param networkController - Instance of NetworkController.
 * @param appStateController
 * @param updateSecurityAlertResponseByTxId
 * @returns PPOMMiddleware function.
 */
export function createPPOMMiddleware(
  ppomController: PPOMController,
  preferencesController: PreferencesController,
  networkController: NetworkController,
  appStateController: any,
  updateSecurityAlertResponseByTxId: (
    req: any,
    securityAlertResponse: SecurityAlertResponse,
  ) => void,
) {
  return async (req: any, _res: any, next: () => void) => {
    try {
      const securityAlertsEnabled =
        preferencesController.store.getState()?.securityAlertsEnabled;
      const { chainId } = networkController.state.providerConfig;
      if (
        securityAlertsEnabled &&
        CONFIRMATION_METHODS.includes(req.method) &&
        SUPPORTED_CHAIN_IDS.includes(chainId)
      ) {
        // eslint-disable-next-line require-atomic-updates
        const securityAlertId = uuid();

        ppomController
          .usePPOM(async (ppom: PPOM) => {
            try {
              const normalizedRequest = normalizePPOMRequest(req);

              const securityAlertResponse = await ppom.validateJsonRpc(
                normalizedRequest,
              );

              securityAlertResponse.securityAlertId = securityAlertId;
              return securityAlertResponse;
            } catch (error: any) {
              sentry?.captureException(error);
              const errorObject = error as unknown as Error;
              console.error('Error validating JSON RPC using PPOM: ', error);
              const securityAlertResponse = {
                result_type: BlockaidResultType.Errored,
                reason: BlockaidReason.errored,
                description: `${errorObject.name}: ${errorObject.message}`,
              };

              return securityAlertResponse;
            }
          })
          .then((securityAlertResponse) => {
            updateSecurityAlertResponseByTxId(req, {
              ...securityAlertResponse,
              securityAlertId,
            });
          });

        if (SIGNING_METHODS.includes(req.method)) {
          req.securityAlertResponse = {
            reason: BlockaidResultType.Loading,
            result_type: BlockaidReason.inProgress,
            securityAlertId,
          };
          appStateController.addSignatureSecurityAlertResponse({
            reason: BlockaidResultType.Loading,
            result_type: BlockaidReason.inProgress,
            securityAlertId,
          });
        } else {
          req.securityAlertResponse = {
            reason: BlockaidResultType.Loading,
            result_type: BlockaidReason.inProgress,
            securityAlertId,
          };
        }
      }
    } catch (error: any) {
      const errorObject = error as unknown as Error;
      sentry?.captureException(error);
      console.error('Error validating JSON RPC using PPOM: ', error);
      req.securityAlertResponse = {
        result_type: BlockaidResultType.Errored,
        reason: BlockaidReason.errored,
        description: `${errorObject.name}: ${errorObject.message}`,
      };
    } finally {
      next();
    }
  };
}
