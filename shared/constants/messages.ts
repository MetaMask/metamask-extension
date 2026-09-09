/**
 * Custom messages to send and be received by the extension
 */
export const EXTENSION_MESSAGES = {
  READY: 'METAMASK_EXTENSION_READY',
  OPEN_SIDEPANEL: 'OPEN_SIDEPANEL',
  REQUEST_OPEN_SIDEPANEL: 'REQUEST_OPEN_SIDEPANEL',
  OPEN_ROUTE: 'METAMASK_OPEN_ROUTE',
} as const;

export const MESSENGER_SUBSCRIPTION_NOTIFICATION = 'messengerSubscription';
