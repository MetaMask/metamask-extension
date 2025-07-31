'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.detectMetamaskExtensionId = detectMetamaskExtensionId;
const constants_1 = require('./constants.cjs');
const constants_2 = require('./constants.cjs');
/**
 * Get the MetaMask extension ID by sending a metamask_getProviderState to the content script
 */
async function detectMetamaskExtensionId() {
  console.log('detectMetamaskExtensionId: start');
  console.time('detectMetamaskExtensionId');
  return new Promise((resolve, reject) => {
    const messageHandler = (event) => {
      const { target, data } = event.data;
      if (
        target === constants_1.INPAGE &&
        data?.name === constants_2.METAMASK_PROVIDER_STREAM_NAME &&
        event.origin === location.origin
      ) {
        const extensionId = data?.data?.result?.extensionId;
        if (extensionId) {
          console.timeEnd('detectMetamaskExtensionId');
          resolve(extensionId);
          window.removeEventListener('message', messageHandler);
          clearTimeout(timeoutId);
        }
      }
    };
    const timeoutId = setTimeout(() => {
      console.log('timeout');
      window.removeEventListener('message', messageHandler);
      reject(new Error('MetaMask extension not found'));
    }, 3000);
    window.addEventListener('message', messageHandler);
    window.postMessage(
      {
        target: constants_1.CONTENT_SCRIPT,
        data: {
          name: constants_2.METAMASK_PROVIDER_STREAM_NAME,
          data: { method: 'metamask_getProviderState' },
        },
      },
      location.origin,
    );
  });
}
//# sourceMappingURL=metamaskExtensionId.cjs.map
