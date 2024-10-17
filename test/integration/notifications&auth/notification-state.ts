import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import mockMetaMaskState from '../data/integration-init-state.json';

const notificationsAccountAddress =
  mockMetaMaskState.internalAccounts.accounts[
    mockMetaMaskState.internalAccounts
      .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
  ].address;

export const ethSentNotification = {
  address: notificationsAccountAddress,
  block_number: 63128386,
  block_timestamp: '1729123936',
  chain_id: 137,
  created_at: '2024-09-17T00:12:16.668784Z',
  data: {
    to: '0x998c0fe265a64ea78b94ef06ee40a67e3ff2190d',
    from: notificationsAccountAddress,
    kind: 'eth_sent',
    amount: {
      eth: '0.000000010000000000',
      usd: '0.00',
    },
    network_fee: {
      gas_price: '29999999995',
      native_token_price_in_usd: '0.372995',
    },
    token: {
      image:
        'https://token.api.cx.metamask.io/assets/nativeCurrencyLogos/matic.svg',
      name: 'Polygon Ecosystem Token',
      symbol: 'POL',
    },
  },
  id: 'e4ee3191-ad7a-5897-9fda-6329b2913aaa',
  trigger_id: 'db0049a7-4e9f-432c-ad8f-c10c4520acb9',
  tx_hash: '0xa42da2da869517ee0716686028d1f606ba77c604c8c3d748e78b536bf4bc6e05',
  type: TRIGGER_TYPES.ERC20_SENT,
  createdAt: '2024-09-17T00:12:16.668Z',
  isRead: true,
};

export const featureNotification = {
  type: 'features_announcement',
  id: 'enhanced-signatures',
  createdAt: '2024-09-27T13:25:59.000Z',
  data: {
    id: 'enhanced-signatures',
    category: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
    title: 'Enhanced signatures',
    longDescription:
      '<p>We’re improving signature requests to increase readability, so you can have more control over your assets. Stay tuned for more updates.</p>',
    shortDescription:
      "An update that makes it easier to understand and review the actions you're about to approve.",
    image: {
      title: 'Enhanced signature confirmations',
      description: 'Enhanced signature confirmations',
      url: '//images.ctfassets.net/jdkgyfmyd9sw/3yXPGO8LxTT7RrrSkotNNz/d3635fcef422aeb607016150e4fd5b85/24-09-10_MwM_Blog-Post-Signature-Redesign_1920x1280.png',
    },
  },
  isRead: true,
};

export const getMockedNotificationsState = () => {
  return {
    ...mockMetaMaskState,
    isProfileSyncingEnabled: true,
    isProfileSyncingUpdateLoading: false,
    isMetamaskNotificationsFeatureSeen: true,
    isNotificationServicesEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    notifications: {},
    metamaskNotificationsReadList: [],
    metamaskNotificationsList: [featureNotification, ethSentNotification],
    isUpdatingMetamaskNotifications: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: [],
    useExternalServices: true,
    preferences: {
      ...mockMetaMaskState.preferences,
      showMultiRpcModal: false,
    },
  };
};
