export const openWindow = (url: string, target?: string) => {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, no-restricted-globals
  window.open(url, target || '_blank', 'noopener');
};
