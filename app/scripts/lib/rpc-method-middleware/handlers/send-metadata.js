import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';

/**
 * This internal method is used by our external provider to send metadata about
 * permission subjects so that we can e.g. display a proper name and icon in
 * our UI.
 */

const sendMetadata = {
  methodNames: [MESSAGE_TYPE.SEND_METADATA],
  implementation: sendMetadataHandler,
  hookNames: {
    addSubjectMetadata: true,
    subjectType: true,
  },
};
export default sendMetadata;

/**
 * @typedef {Record<string, Function>} SendMetadataOptions
 * @property {Function} addSubjectMetadata - A function that records subject
 * metadata, bound to the requesting origin.
 * @property {string} subjectType - The type of the requesting origin / subject.
 */

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<unknown>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {SendMetadataOptions} options
 */
function sendMetadataHandler(
  req,
  res,
  _next,
  end,
  { addSubjectMetadata, subjectType },
) {
  const { origin, params } = req;
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    const { icon = null, name = null, ...remainingParams } = params;

    addSubjectMetadata({
      ...remainingParams,
      iconUrl: icon,
      name,
      subjectType,
      origin,
    });
  } else {
    return end(ethErrors.rpc.invalidParams({ data: params }));
  }

  res.result = true;
  return end();
}
