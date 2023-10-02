import { PPOM } from '@blockaid/ppom_release';
import { PPOMController } from '@metamask/ppom-validator';
import { NetworkController } from '@metamask/network-controller';

import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import PreferencesController from '../../controllers/preferences';

const { sentry } = global as any;

const ConfirmationMethods = Object.freeze([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
]);

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
 * @returns PPOMMiddleware function.
 */
export function createPPOMMiddleware(
  ppomController: PPOMController,
  preferencesController: PreferencesController,
  networkController: NetworkController,
) {
  return async (req: any, _res: any, next: () => void) => {
    try {
      const securityAlertsEnabled =
        preferencesController.store.getState()?.securityAlertsEnabled;
      const { chainId } = networkController.state.providerConfig;
      if (
        securityAlertsEnabled &&
        ConfirmationMethods.includes(req.method) &&
        chainId === CHAIN_IDS.MAINNET
      ) {
        // eslint-disable-next-line require-atomic-updates
        req.securityAlertResponse = await ppomController.usePPOM(
          async (ppom: PPOM) => {
            return ppom.validateJsonRpc(req);
          },
        );
      }
    } catch (error: any) {
      sentry?.captureException(error);
      console.error('Error validating JSON RPC using PPOM: ', error);
      req.securityAlertResponse = {
        result_type: BlockaidResultType.Failed,
        reason: BlockaidReason.failed,
        description: 'Validating the confirmation failed by throwing error.',
      };
    } finally {
      next();
    }
  };
}
