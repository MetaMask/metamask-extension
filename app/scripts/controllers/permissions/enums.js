export const WALLET_PREFIX = 'wallet_';

export const NOTIFICATION_NAMES = {
  accountsChanged: 'metamask_accountsChanged',
  unlockStateChanged: 'metamask_unlockStateChanged',
  chainChanged: 'metamask_chainChanged',
};

export const LOG_IGNORE_METHODS = [
  'wallet_registerOnboarding',
  'wallet_watchAsset',
];

export const LOG_METHOD_TYPES = {
  restricted: 'restricted',
  internal: 'internal',
};

/**
 * The permission activity log size limit.
 */
export const LOG_LIMIT = 100;
