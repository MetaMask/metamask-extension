import { PPOM } from '@blockaid/ppom';

import { PPOMController } from '@metamask/ppom-validator';

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
 * @returns PPOMMiddleware function.
 */
export function createPPOMMiddleware(ppomController: PPOMController) {
  return async (req: any, _res: any, next: () => void) => {
    try {
      if (ConfirmationMethods.includes(req.method)) {
        // eslint-disable-next-line require-atomic-updates
        req.ppomResponse = await ppomController.usePPOM(async (ppom: PPOM) => {
          return ppom.validateJsonRpc(req);
        });
      }
    } catch (error: unknown) {
      console.error('Error validating JSON RPC using PPOM: ', error);
    } finally {
      next();
    }
  };
}
