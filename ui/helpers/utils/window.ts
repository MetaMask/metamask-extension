export const openWindow = (url: string, target?: string) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880

  window.open(url, target || '_blank', 'noopener');
};
