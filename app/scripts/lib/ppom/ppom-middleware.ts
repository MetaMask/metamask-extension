import { PPOMController } from '@metamask/ppom-validator';
import { NetworkController } from '@metamask/network-controller';
import {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SIGNING_METHODS } from '../../../../shared/constants/transaction';
import { PreferencesController } from '../../controllers/preferences';
import { SecurityAlertResponse } from '../transaction/util';
import {
  generateSecurityAlertId,
  handlePPOMError,
  validateRequestWithPPOM,
} from './ppom-util';

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
 * @param updateSecurityAlertResponse
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
  updateSecurityAlertResponse: (
    method: string,
    signatureAlertId: string,
    securityAlertResponse: SecurityAlertResponse,
  ) => void,
) {
  return async (
    req: JsonRpcRequest<Params>,
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
    try {
      const securityAlertsEnabled =
        preferencesController.store.getState()?.securityAlertsEnabled;

      const { chainId } = networkController.state.providerConfig;

      if (
        !securityAlertsEnabled ||
        !CONFIRMATION_METHODS.includes(req.method) ||
        !SUPPORTED_CHAIN_IDS.includes(chainId)
      ) {
        return;
      }

      const securityAlertId = generateSecurityAlertId();

      validateRequestWithPPOM({
        chainId,
        ppomController,
        request: req,
        securityAlertId,
      }).then((securityAlertResponse) => {
        updateSecurityAlertResponse(
          req.method,
          securityAlertId,
          securityAlertResponse,
        );
      });

      const loadingSecurityAlertResponse: SecurityAlertResponse = {
        result_type: BlockaidResultType.Loading,
        reason: BlockaidReason.inProgress,
        securityAlertId,
      };

      if (SIGNING_METHODS.includes(req.method)) {
        appStateController.addSignatureSecurityAlertResponse(
          loadingSecurityAlertResponse,
        );
      }

      req.securityAlertResponse = loadingSecurityAlertResponse;
    } catch (error) {
      req.securityAlertResponse = handlePPOMError(
        error,
        'Error createPPOMMiddleware: ',
      );
    } finally {
      next();
    }
  };
}
