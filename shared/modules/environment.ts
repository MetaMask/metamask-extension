import { ENVIRONMENT } from '../../development/build/constants';

export const isProduction = (): boolean => {
  return (
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.DEVELOPMENT &&
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.TESTING
  );
};
