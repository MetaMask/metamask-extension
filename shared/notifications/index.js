import { getSwapsFeatureLiveness } from '../../ui/app/ducks/swaps/swaps';
import { getSwapsEthToken, getIsMainnet } from '../../ui/app/selectors';
import { BUILD_QUOTE_ROUTE } from '../../ui/app/helpers/constants/routes';

export const UI_NOTIFICATIONS = {
  1: {
    id: 1,
    title: 'Now Swap tokens directly in your wallet!',
    description:
      'MetaMask now aggregates multiple decentralized exchange aggregators to ensure you always get the best swap price with the lowest netwrok fees.',
    date: '02/22/2020',
    image: 'images/swaps-logos-small.svg',
    actionText: 'Start swapping',
  },
  2: {
    id: 2,
    title: 'MetaMask Mobile is here!',
    description:
      'Sync with your extension wallet in seconds. Scan the QR code with your phone camera to download the app.',
    date: '02/22/2020',
    actionText: 'Get the mobile app',
  },
  3: {
    id: 3,
    title: 'Help improve MetaMask',
    description: 'Please share your experience in this 5 minute survey.',
    date: '02/22/2020',
    actionText: 'Start survey',
  },
};

function getNotificationFilters(state) {
  const currentNetworkIsMainnet = getIsMainnet(state);
  const swapsIsEnabled = getSwapsFeatureLiveness(state);

  return {
    1: !currentNetworkIsMainnet || !swapsIsEnabled,
  };
}

export function getSortedNotificationsToShow(state) {
  const notifications = Object.values(state.metamask.notifications) || [];
  const notificationFilters = getNotificationFilters(state);
  const notificationsToShow = notifications.filter(
    (notification) =>
      !notification.isShown && !notificationFilters[notification.id],
  );
  const notificationsSortedByDate = notificationsToShow.sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  return notificationsSortedByDate;
}

export function notifcationActionFunctions(
  // eslint-disable-next-line no-unused-vars
  dispatch,
  // eslint-disable-next-line no-unused-vars
  state,
  // eslint-disable-next-line no-unused-vars
  history,
  // eslint-disable-next-line no-unused-vars
  metricsEvent,
) {
  const swapsEthToken = getSwapsEthToken(state);

  const actionFunctions = {
    1: () => {
      metricsEvent({
        event: 'Swaps Opened',
        properties: { source: 'Main View', active_currency: 'ETH' },
        category: 'swaps',
      });
      global.platform.openExtensionInBrowser(
        BUILD_QUOTE_ROUTE,
        `fromAddress=${swapsEthToken.address}`,
      );
    },
    2: () => {
      global.platform.openTab({
        url: 'https://metamask.io/download.html',
      });
    },
    3: () => {
      global.platform.openTab({
        url:
          'https://survey.alchemer.com/s3/6173069/MetaMask-Extension-NPS-January-2021',
      });
    },
  };

  return (id) => {
    return actionFunctions[id];
  };
}
