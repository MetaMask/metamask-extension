import { isAllowedRPCOrigin } from '@metamask-institutional/rpc-allowlist';
import { rpcErrors } from '@metamask/rpc-errors';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiSetAccountAndNetwork = {
  methodNames: [MESSAGE_TYPE.MMI_SET_ACCOUNT_AND_NETWORK],
  implementation: mmiSetAccountAndNetworkHandler,
  hookNames: {
    handleMmiSetAccountAndNetwork: true,
  },
};
export default mmiSetAccountAndNetwork;

/**
 * @typedef {object} MmiSetAccountAndNetworkOptions
 * @property {Function} handleMmiSetAccountAndNetwork - The metmaskinsititutional_set_account_and_network method implementation.
 */

/**
 * @typedef {object} MmiSetAccountAndNetworkParam
 * @property {string} account - Account address
 * @property {number} network - Chain Id
 */

/**
 * @param {import('@metamask/json-rpc-engine').JsonRpcRequest<MmiSetAccountAndNetworkParam>} req - The JSON-RPC request object.
 * @param {import('@metamask/json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {WatchAssetOptions} options
 */
async function mmiSetAccountAndNetworkHandler(
  req,
  res,
  _next,
  end,
  { handleMmiSetAccountAndNetwork },
) {
  try {
    const validUrl = isAllowedRPCOrigin(MESSAGE_TYPE.MMI_PORTFOLIO, req.origin);

    // eslint-disable-next-line no-negated-condition
    if (!validUrl) {
      throw new Error('Unauthorized');
    }

    if (!req.params?.[0] || typeof req.params[0] !== 'object') {
      return end(
        rpcErrors.invalidParams({
          message: `Expected single, object parameter. Received:\n${JSON.stringify(
            req.params,
          )}`,
        }),
      );
    }
    const { address, network } = req.params[0];
    res.result = await handleMmiSetAccountAndNetwork(
      req.origin,
      address,
      network,
    );
    return end();
  } catch (error) {
    return end(error);
  }
}
