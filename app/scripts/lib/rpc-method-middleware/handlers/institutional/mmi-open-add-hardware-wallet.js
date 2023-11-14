import { RPC_ALLOWED_ORIGINS } from '@metamask-institutional/rpc-allowlist';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';

const mmiOpenAddHardwareWallet = {
  methodNames: [MESSAGE_TYPE.MMI_OPEN_ADD_HARDWARE_WALLET],
  implementation: mmiOpenAddHardwareWalletHandler,
  hookNames: {
    handleMmiOpenAddHardwareWallet: true,
  },
};
export default mmiOpenAddHardwareWallet;

/**
 * @typedef {object} MmiOpenAddHardwareWalletOptions
 * @property {Function} handleMmiOpenAddHardwareWallet - The metmaskinsititutional_openAddHardwareWallet method implementation.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {WatchAssetOptions} options
 */
async function mmiOpenAddHardwareWalletHandler(
  req,
  res,
  _next,
  end,
  { handleMmiOpenAddHardwareWallet },
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
    res.result = await handleMmiOpenAddHardwareWallet();
    return end();
  } catch (error) {
    return end(error);
  }
}
