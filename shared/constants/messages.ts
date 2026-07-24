/**
 * Custom messages to send and be received by the extension
 */
export const EXTENSION_MESSAGES = {
  READY: 'METAMASK_EXTENSION_READY',
  GET_REMOTE_FEATURE_FLAG: 'METAMASK_GET_REMOTE_FEATURE_FLAG',
  OPEN_SWAP_PAGE: 'METAMASK_OPEN_SWAP_PAGE',
  GET_ASSET_DATA: 'METAMASK_GET_ASSET_DATA',
} as const;

export const MESSENGER_SUBSCRIPTION_NOTIFICATION = 'messengerSubscription';
