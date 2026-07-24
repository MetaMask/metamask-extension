// msLaunchUri is a non-standard Windows-specific extension to the Navigator API
type NavigatorWithMsLaunchUri = Navigator & {
  msLaunchUri?: (
    uri: string,
    successCallback?: () => void,
    errorCallback?: () => void,
  ) => void;
};

export function openCustomProtocol(protocolLink: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // msLaunchUri is windows specific. It will open and app or service
    // that handles a given protocol
    const navigator = window?.navigator as NavigatorWithMsLaunchUri | undefined;
    if (navigator?.msLaunchUri) {
      navigator.msLaunchUri(protocolLink, resolve, () => {
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
      window.location.href = protocolLink;
    }
  });
}
