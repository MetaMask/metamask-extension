import { ethErrors } from 'eth-rpc-errors';
import { RPC_ALLOWED_ORIGINS } from '@metamask-institutional/rpc-allowlist';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiOpenSwaps = {
  methodNames: [MESSAGE_TYPE.MMI_OPEN_SWAPS],
  implementation: mmiOpenSwapsHandler,
  hookNames: {
    handleMmiOpenSwaps: true,
  },
};
export default mmiOpenSwaps;

/**
 * @typedef {object} MmiOpenSwapsOptions
 * @property {Function} handleMmiOpenSwaps - The metmaskinsititutional_open_swaps method implementation.
 */

/**
 * @typedef {object} MmiOpenSwapsParam
 * @property {string} service - The service to which we are authenticating, e.g. 'codefi-compliance'
 * @property {object} token - The token used to authenticate
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<MmiOpenSwapsParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {WatchAssetOptions} options
 */
async function mmiOpenSwapsHandler(
  req,
  res,
  _next,
  end,
  { handleMmiOpenSwaps },
) {
  try {
    let validUrl = false;
    // if (!RPC_ALLOWED_ORIGINS[MESSAGE_TYPE.MMI_PORTFOLIO].includes(req.origin)) {
    RPC_ALLOWED_ORIGINS[MESSAGE_TYPE.MMI_PORTFOLIO].forEach((regexp) => {
      // eslint-disable-next-line require-unicode-regexp
      if (regexp.test(req.origin)) {
        validUrl = true;
      }
    });
    // eslint-disable-next-line no-negated-condition
    if (!validUrl) {
      throw new Error('Unauthorized');
    }

    if (!req.params?.[0] || typeof req.params[0] !== 'object') {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected single, object parameter. Received:\n${JSON.stringify(
            req.params,
          )}`,
        }),
      );
    }
    const { address, network } = req.params[0];
    res.result = await handleMmiOpenSwaps(req.origin, address, network);
    return end();
  } catch (error) {
    return end(error);
  }
}
