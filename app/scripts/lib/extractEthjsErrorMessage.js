const ethJsRpcSlug = 'Error: [ethjs-rpc] rpc error with payload ';
const errorLabelPrefix = 'Error: ';

/**
 * Extracts the important part of an ethjs-rpc error message. If the passed error is not an isEthjsRpcError, the error
 * is returned unchanged.
 *
 * @param {string} errorMessage - The error message to parse
 * @returns {string} Returns an error message, either the same as was passed, or the ending message portion of an isEthjsRpcError
 *
 * @example
 * // returns 'Transaction Failed: replacement transaction underpriced'
 * extractEthjsErrorMessage(`Error: [ethjs-rpc] rpc error with payload {"id":3947817945380,"jsonrpc":"2.0","params":["0xf8eb8208708477359400830398539406012c8cf97bead5deae237070f9587f8e7a266d80b8843d7d3f5a0000000000000000000000000000000000000000000000000000000000081d1a000000000000000000000000000000000000000000000000001ff973cafa800000000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000003f48025a04c32a9b630e0d9e7ff361562d850c86b7a884908135956a7e4a336fa0300d19ca06830776423f25218e8d19b267161db526e66895567147015b1f3fc47aef9a3c7"],"method":"eth_sendRawTransaction"} Error: replacement transaction underpriced`)
 *
 */
export default function extractEthjsErrorMessage(errorMessage) {
  const isEthjsRpcError = errorMessage.includes(ethJsRpcSlug);
  if (isEthjsRpcError) {
    const payloadAndError = errorMessage.slice(ethJsRpcSlug.length);
    const originalError = payloadAndError.slice(
      payloadAndError.indexOf(errorLabelPrefix) + errorLabelPrefix.length,
    );
    return originalError;
  }
  return errorMessage;
}
