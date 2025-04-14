export function openCustomProtocol(protocolLink) {
  return new Promise((resolve, reject) => {
    // msLaunchUri is windows specific. It will open and app or service
    // that handles a given protocol
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    if (window?.navigator?.msLaunchUri) {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      window.navigator.msLaunchUri(protocolLink, resolve, () => {
        reject(new Error('Failed to open custom protocol link'));
      });
    } else {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      const timeoutId = window.setTimeout(function () {
        reject(new Error('Timeout opening custom protocol link'));
      }, 500);
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      window.addEventListener('blur', function () {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
        // eslint-disable-next-line no-restricted-globals
        window.clearTimeout(timeoutId);
        resolve();
      });
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      window.location = protocolLink;
    }
  });
}
