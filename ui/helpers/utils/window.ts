export const openWindow = (url: string, target?: string) => {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  window.open(url, target || '_blank', 'noopener');
};
