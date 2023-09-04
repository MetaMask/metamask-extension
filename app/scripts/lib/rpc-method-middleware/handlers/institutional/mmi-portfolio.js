import { RPC_ALLOWED_ORIGINS } from '@metamask-institutional/rpc-allowlist';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiPortfolio = {
  methodNames: [MESSAGE_TYPE.MMI_PORTFOLIO],
  implementation: mmiPortfolioHandler,
  hookNames: {
    handleMmiDashboardData: true,
  },
};
export default mmiPortfolio;

/**
 * @typedef {object} MmiPortfolioOptions
 * @property {Function} handleMmiDashboardData - The metmaskinsititutional_portfolio method implementation.
 */

/**
 * @typedef {object} MmiPortfolioParam
 * @property {string} service - The service to which we are authenticating, e.g. 'codefi-compliance'
 * @property {object} token - The token used to authenticate
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<MmiPortfolioParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {WatchAssetOptions} options
 */
async function mmiPortfolioHandler(
  req,
  res,
  _next,
  end,
  { handleMmiDashboardData },
) {
  try {
    let validUrl = false;
    RPC_ALLOWED_ORIGINS[MESSAGE_TYPE.MMI_PORTFOLIO].forEach((regexp) => {
      // eslint-disable-next-line require-unicode-regexp
      if (regexp.test(req.origin)) {
        validUrl = true;
      }
    });
    // eslint-disable-next-line no-negated-condition
    if (!validUrl) {
      throw new Error('Unauthorized');
    } else {
      res.result = await handleMmiDashboardData(req);
      return end();
    }
  } catch (error) {
    return end(error);
  }
}
