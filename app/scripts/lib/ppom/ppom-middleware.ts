import { PPOM } from '@blockaid/ppom_release';
import { PPOMController } from '@metamask/ppom-validator';
import { NetworkController } from '@metamask/network-controller';
import {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
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

const { sentry } = global;

const CONFIRMATION_METHODS = Object.freeze([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  ...SIGNING_METHODS,
]);

export const SUPPORTED_CHAIN_IDS: Hex[] = [
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.BASE,
  CHAIN_IDS.BSC,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.OPBNB,
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
export function createPPOMMiddleware<
  Params extends JsonRpcParams,
  Result extends Json,
>(
  ppomController: PPOMController,
  preferencesController: PreferencesController,
  networkController: NetworkController,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appStateController: any,
  updateSecurityAlertResponseByTxId: (
    req: JsonRpcRequest<JsonRpcParams> & {
      securityAlertResponse: SecurityAlertResponse;
    },
    securityAlertResponse: SecurityAlertResponse,
  ) => void,
) {
  return async (
    req: JsonRpcRequest<Params> & {
      securityAlertResponse: SecurityAlertResponse;
    },
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
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
        let securityAlertResponse: SecurityAlertResponse = {
          reason: BlockaidResultType.Loading,
          result_type: BlockaidReason.inProgress,
          securityAlertId,
        };

        ppomController
          .usePPOM(async (ppom: PPOM) => {
            try {
              const normalizedRequest = normalizePPOMRequest(req);

              securityAlertResponse = await ppom.validateJsonRpc(
                normalizedRequest,
              );
              securityAlertResponse.securityAlertId = securityAlertId;
            } catch (error: unknown) {
              sentry?.captureException(error);
              console.error(
                'Error validating JSON RPC using PPOM: ',
                typeof error === 'object' || typeof error === 'string'
                  ? error
                  : JSON.stringify(error),
              );

              securityAlertResponse = {
                result_type: BlockaidResultType.Errored,
                reason: BlockaidReason.errored,
                description:
                  error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : JSON.stringify(error),
              };
            }
          })
          .catch((error: unknown) => {
            sentry?.captureException(error);
            console.error(
              'Error createPPOMMiddleware#usePPOM: ',
              typeof error === 'object' || typeof error === 'string'
                ? error
                : JSON.stringify(error),
            );

            securityAlertResponse = {
              result_type: BlockaidResultType.Errored,
              reason: BlockaidReason.errored,
              description:
                error instanceof Error
                  ? `${error.name}: ${error.message}`
                  : JSON.stringify(error),
            };
          })
          .finally(() => {
            updateSecurityAlertResponseByTxId(req, {
              ...securityAlertResponse,
              securityAlertId,
            });
          });

        if (SIGNING_METHODS.includes(req.method)) {
          appStateController.addSignatureSecurityAlertResponse({
            reason: BlockaidResultType.Loading,
            result_type: BlockaidReason.inProgress,
            securityAlertId,
          });
        }

        req.securityAlertResponse = { ...securityAlertResponse };
      }
    } catch (error: unknown) {
      sentry?.captureException(error);
      console.error(
        'Error createPPOMMiddleware: ',
        typeof error === 'object' || typeof error === 'string'
          ? error
          : JSON.stringify(error),
      );

      req.securityAlertResponse = {
        result_type: BlockaidResultType.Errored,
        reason: BlockaidReason.errored,
        description:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : JSON.stringify(error),
      };
    } finally {
      next();
    }
  };
}
