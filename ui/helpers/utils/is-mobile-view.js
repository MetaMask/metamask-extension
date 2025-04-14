// Checks if viewport at invoke time fits mobile dimensions
// isMobileView :: () => Bool
const isMobileView = () =>
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  window.matchMedia('screen and (max-width: 575px)').matches;

export default isMobileView;
