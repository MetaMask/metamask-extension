import { RPC_VALIDATION_PORT } from '../../shared/lib/rpc-endpoint-validation';
import { requestRpcChainId } from './lib/rpc-endpoint-validation-request';

// This isolated entry imports no dependencies or UI/background code. Its
// one-shot connection can only request eth_chainId; the background grants a
// tab-scoped network exception after authenticating this document.
const port = chrome.runtime.connect({ name: RPC_VALIDATION_PORT });
port.onMessage.addListener(function onRequest(message: unknown) {
  if (
    message === null ||
    typeof message !== 'object' ||
    !('url' in message) ||
    typeof message.url !== 'string'
  ) {
    return;
  }
  port.onMessage.removeListener(onRequest);
  requestRpcChainId(message.url).then(
    (result) => port.postMessage(result),
    () => port.postMessage({ error: {} }),
  );
});
