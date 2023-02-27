export function openCustomProtocol(protocolLink) {
  return new Promise((resolve, reject) => {
    // msLaunchUri is windows specific. It will open and app or service
    // that handles a given protocol
    if (window?.navigator?.msLaunchUri) {
      window.navigator.msLaunchUri(protocolLink, resolve, () => {
        reject(new Error('Failed to open custom protocol link'));
      });
    } else {
      const timeoutId = window.setTimeout(function () {
        reject(new Error('Timeout opening custom protocol link'));
      }, 500);
      window.addEventListener('blur', function () {
        window.clearTimeout(timeoutId);
        resolve();
      });
      window.location = protocolLink;
    }
  });
}
