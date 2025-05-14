export const openWindow = (url: string, target?: string) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  window.open(url, target || '_blank', 'noopener');
};
