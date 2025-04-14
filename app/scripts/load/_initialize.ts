/* eslint-disable @typescript-eslint/no-require-imports */
// currently only used in webpack build.

// The root compartment will populate this with hooks
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.stateHooks = {} as typeof stateHooks;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (process.env.ENABLE_LAVAMOAT === 'true') {
  // TODO: lavamoat support
  throw new Error('LAVAMOAT not supported in webpack build yet');
} else {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  if (process.env.ENABLE_SENTRY === 'true') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    require('../sentry-install');
  }
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  if (process.env.ENABLE_SNOW === 'true') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    require('@lavamoat/snow/snow.prod');
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    require('../use-snow');
  }
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  if (process.env.ENABLE_LOCKDOWN === 'true') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    require('../lockdown-install');
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    require('../lockdown-run');
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    require('../lockdown-more');
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  require('../init-globals');
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  require('../runtime-cjs');
}

export {};
