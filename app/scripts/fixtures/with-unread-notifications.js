import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a specified number of unread notifications for the given account.
 *
 * @param {string} account - The account address to use in the notifications.
 * @param {number} numNotifications - The number of unread notifications to generate.
 * @returns {object} The generated unread notifications object.
 */
export const withUnreadNotifications = (account, numNotifications) => {
  const notifications = [];

  for (let i = 0; i < numNotifications; i++) {
    const id = uuidv4();
    const triggerId = uuidv4();
    const txHash = `0x${uuidv4().replace(/-/gu, '').padEnd(64, '0')}`;

    const notification = {
      address: account,
      block_number: 59796924,
      block_timestamp: '1721922504',
      chain_id: 1,
      created_at: new Date().toISOString(),
      data: {
        to: account,
        from: account,
        kind: 'eth_received',
        amount: {
          eth: '0.000100000000000000',
          usd: '0.27',
        },
        network_fee: {
          gas_price: '30000000078',
          native_token_price_in_usd: '0.497927',
        },
      },
      id,
      trigger_id: triggerId,
      tx_hash: txHash,
      unread: true,
      type: 'eth_received',
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    notifications.push(notification);
  }

  const notificationServicesController = {
    isFeatureAnnouncementsEnabled: true,
    isMetamaskNotificationsFeatureSeen: true,
    isNotificationServicesEnabled: true,
    metamaskNotificationsReadList: [],
    metamaskNotificationsList: notifications,
  };
  return notificationServicesController;
};
