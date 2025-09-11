import { AccountsController } from '@metamask/accounts-controller';
import { PPOMController } from '@metamask/ppom-validator';
import {
  NetworkClientId,
  NetworkController,
} from '@metamask/network-controller';
import {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '@metamask/utils';
import { detectSIWE } from '@metamask/controller-utils';

import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { SIGNING_METHODS } from '../../../../shared/constants/transaction';
import { PreferencesController } from '../../controllers/preferences-controller';
import { AppStateController } from '../../controllers/app-state-controller';
import { trace, TraceContext, TraceName } from '../../../../shared/lib/trace';
import { LOADING_SECURITY_ALERT_RESPONSE } from '../../../../shared/constants/security-provider';
import {
  generateSecurityAlertId,
  handlePPOMError,
  validateRequestWithPPOM,
} from './ppom-util';
import {
  SecurityAlertResponse,
  GetSecurityAlertsConfig,
  UpdateSecurityAlertResponse,
} from './types';

const CONFIRMATION_METHODS = Object.freeze([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  ...SIGNING_METHODS,
]);

export type PPOMMiddlewareRequest<
  Params extends JsonRpcParams = JsonRpcParams,
> = Required<JsonRpcRequest<Params>> & {
  securityAlertResponse?: SecurityAlertResponse | undefined;
  traceContext?: TraceContext;
  networkClientId: NetworkClientId;
};

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
 * @param accountsController - Instance of AccountsController.
 * @param updateSecurityAlertResponse
 * @param getSecurityAlertsConfig - Optional method to get transaction security alerts parameters.
 * @returns PPOMMiddleware function.
 */
export function createPPOMMiddleware<
  Params extends (string | { to: string })[],
  Result extends Json,
>(
  ppomController: PPOMController,
  preferencesController: PreferencesController,
  networkController: NetworkController,
  appStateController: AppStateController,
  accountsController: AccountsController,
  updateSecurityAlertResponse: UpdateSecurityAlertResponse,
  getSecurityAlertsConfig?: () => GetSecurityAlertsConfig,
) {
  return async (
    req: PPOMMiddlewareRequest<Params>,
    _res: JsonRpcResponse<Result>,
    next: () => void,
  ) => {
    try {
      const { securityAlertsEnabled } = preferencesController.state;

      const { chainId } =
        networkController.getNetworkConfigurationByNetworkClientId(
          req.networkClientId,
        ) ?? {};

      if (!chainId) {
        throw Error('ChainID not found for networkClientId');
      }

      if (
        !securityAlertsEnabled ||
        !CONFIRMATION_METHODS.includes(req.method)
      ) {
        return;
      }

      const data = req.params[0];
      if (typeof data === 'string') {
        const { isSIWEMessage } = detectSIWE({ data });
        if (isSIWEMessage) {
          return;
        }
      } else if (req.method === MESSAGE_TYPE.ETH_SEND_TRANSACTION) {
        const { to: toAddress } = data ?? {};
        const internalAccounts = accountsController.listAccounts();
        const isToInternalAccount = internalAccounts.some(
          ({ address }) => address?.toLowerCase() === toAddress?.toLowerCase(),
        );
        if (isToInternalAccount) {
          return;
        }
      }

      const securityAlertId = generateSecurityAlertId();

      trace(
        { name: TraceName.PPOMValidation, parentContext: req.traceContext },
        () =>
          validateRequestWithPPOM({
            ppomController,
            request: req,
            securityAlertId,
            chainId: chainId as Hex,
            updateSecurityAlertResponse,
            getSecurityAlertsConfig: getSecurityAlertsConfig?.(),
          }),
      );

      const securityAlertResponseLoading: SecurityAlertResponse = {
        ...LOADING_SECURITY_ALERT_RESPONSE,
        securityAlertId,
      };

      if (SIGNING_METHODS.includes(req.method)) {
        appStateController.addSignatureSecurityAlertResponse(
          securityAlertResponseLoading,
        );
      }

      req.securityAlertResponse = securityAlertResponseLoading;
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
