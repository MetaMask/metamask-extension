export const openWindow = (url: string, target?: string) => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
  window.open(url, target || '_blank', 'noopener');
};
