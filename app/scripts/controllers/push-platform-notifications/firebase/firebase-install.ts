/* eslint-disable import/unambiguous */
// eslint-disable-next-line spaced-comment
/// <reference lib="WebWorker" />

import type { MessagePayload } from '../types/types';
import { initializeApp } from './firebase-app';
import { getMessaging, onBackgroundMessage } from './firebase-messaging-sw';

type ChainSymbolType = {
  [key: number]: string;
};

interface NotificationData {
  data?: {
    kind: string;
    token?: {
      symbol: string;
    };
  };
  chain_id: number;
}

interface NotificationMessage {
  title: string;
  description: string | null;
  getDesc?: (n: NotificationData) => string | null;
}

interface NotificationMessages {
  [key: string]: NotificationMessage;
}

const sw = self as unknown as ServiceWorkerGlobalScope;

export const initializeFirebaseSW = () => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload: MessagePayload) => {
    const typedPayload = payload;

    console.log('payload', payload);

    try {
      const notificationData = typedPayload?.data?.data
        ? JSON.parse(typedPayload?.data?.data)
        : undefined;
      if (!notificationData) {
        return;
      }

      const notificationMessage = createNotificationMessage(notificationData);
      if (!notificationMessage) {
        return;
      }

      const registration = sw?.registration;
      if (!registration) {
        return;
      }

      // This block retrieves all clients controlled by the service worker and sends them a message.
      // The message contains the notification data, allowing the clients to handle the notification
      sw.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            msg: notificationData,
          });
        });
      });

      // eslint-disable-next-line consistent-return
      return registration.showNotification(notificationMessage.title, {
        body: notificationMessage.description ?? '',
        icon: '/favicon.png',
      });
    } catch (e) {
      // Do Nothing, cannot parse a bad notification
      console.error('Unable to send push notification', {
        notification: payload?.data?.data,
        error: e,
      });
    }
  });

  sw.addEventListener('notificationclick', (event) => {
    // Close the notification when clicked
    event?.notification?.close();
  });

  // -- NOTIFICATION CREATION --
  const chainSymbol: ChainSymbolType = {
    1: 'ETH', // ETHEREUM
    10: 'ETH', // OPTIMISM
    56: 'BNB', // BINANCE
    137: 'MATIC', // POLYGON
    42161: 'ETH', // ARBITRUM
    43114: 'AVAX', // AVALANCHE
    59144: 'ETH', // LINEA
  };

  const getChainSymbol = (chainId: number) => {
    return chainSymbol[chainId] ?? null;
  };

  const notificationMessages: NotificationMessages = {
    erc20_sent: {
      title: 'Funds sent',
      description: 'You have successfully sent some tokens',
      getDesc: (n: NotificationData) => {
        const symbol = n?.data?.token?.symbol;
        if (!symbol) {
          return null;
        }
        return `You have successfully sent some ${symbol}`;
      },
    },
    eth_sent: {
      title: 'Funds sent',
      description: 'You have successfully sent some tokens',
      getDesc: (n: NotificationData) => {
        const symbol = getChainSymbol(n?.chain_id);
        if (!symbol) {
          return null;
        }
        return `You have successfully sent some ${symbol}`;
      },
    },
    erc20_received: {
      title: 'Funds received',
      description: 'You received some tokens',
      getDesc: (n: NotificationData) => {
        const symbol = n?.data?.token?.symbol;
        if (!symbol) {
          return null;
        }
        return `You received some ${symbol}`;
      },
    },
    eth_received: {
      title: 'Funds received',
      description: 'You received some tokens',
      getDesc: (n: NotificationData) => {
        const symbol = getChainSymbol(n?.chain_id);
        if (!symbol) {
          return null;
        }
        return `You received some ${symbol}`;
      },
    },
    metamask_swap_completed: {
      title: 'Swap completed',
      description: 'Your MetaMask Swap was successful',
    },
    erc721_sent: {
      title: 'NFT sent',
      description: 'You have successfully sent an NFT',
    },
    erc1155_sent: {
      title: 'NFT sent',
      description: 'You have successfully sent an NFT',
    },
    erc721_received: {
      title: 'NFT received',
      description: 'You received new NFTs',
    },
    erc1155_received: {
      title: 'NFT received',
      description: 'You received new NFTs',
    },
    rocketpool_stake_completed: {
      title: 'Stake complete',
      description: 'Your RocketPool stake was successful',
    },
    rocketpool_unstake_completed: {
      title: 'Unstake complete',
      description: 'Your RocketPool unstake was successful',
    },
    lido_stake_completed: {
      title: 'Stake complete',
      description: 'Your Lido stake was successful',
    },
    lido_stake_ready_to_be_withdrawn: {
      title: 'Stake ready for withdrawal',
      description: 'Your Lido stake is now ready to be withdrawn',
    },
    lido_withdrawal_requested: {
      title: 'Withdrawal requested',
      description: 'Your Lido withdrawal request was submitted',
    },
    lido_withdrawal_completed: {
      title: 'Withdrawal completed',
      description: 'Your Lido withdrawal was successful',
    },
  };

  /**
   * Creates a notification message based on the notification data received.
   *
   * This function looks up the notification kind from the provided data, matches it against
   * a predefined list of notification messages, and constructs a notification message object.
   * If the notification kind supports dynamic descriptions (via `getDesc`), it attempts to
   * generate a custom description. If any part of the data is missing or an error occurs,
   * the function returns null.
   *
   * @param n - The notification data containing the kind of notification and additional data.
   * @returns An object containing the title and description for the notification, or null if
   * the notification data is invalid or an error occurs.
   */
  function createNotificationMessage(n: NotificationData) {
    if (!n?.data?.kind) {
      return null;
    }
    const messageObj = notificationMessages[n?.data?.kind];

    if (!messageObj) {
      return null;
    }

    let { description } = messageObj;
    try {
      if (messageObj?.getDesc) {
        description = messageObj.getDesc(n);
      }
    } catch {
      description = messageObj.description;
    }

    return {
      title: messageObj.title,
      description,
    };
  }
};
