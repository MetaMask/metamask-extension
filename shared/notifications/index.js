import { ETH_SWAPS_TOKEN_OBJECT } from '../constants/swaps';
import { BUILD_QUOTE_ROUTE } from '../../ui/app/helpers/constants/routes';

// Messages and descriptions for these locale keys are in app/_locales/en/messages.json
export const UI_NOTIFICATIONS = {
  1: {
    id: 1,
    title: 'notificationsTitle1',
    description: 'notificationsDescription1',
    date: '2020-03-17',
    image: 'images/swaps-logos-small.svg',
    actionText: 'notificationsActionText1',
  },
  2: {
    id: 2,
    title: 'notificationsTitle2',
    description: 'notificationsDescription2',
    date: '2020-03-17',
    actionText: 'notificationsActionText2',
  },
  3: {
    id: 3,
    title: 'notificationsTitle3',
    description: 'notificationsDescription3',
    date: '2020-03-17',
    actionText: 'notificationsActionText3',
  },
};

export function notifcationActionFunctions(metricsEvent) {
  const actionFunctions = {
    1: () => {
      metricsEvent({
        event: 'Swaps Opened',
        properties: { source: 'Main View', active_currency: 'ETH' },
        category: 'swaps',
      });
      global.platform.openExtensionInBrowser(
        BUILD_QUOTE_ROUTE,
        `fromAddress=${ETH_SWAPS_TOKEN_OBJECT.address}`,
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
