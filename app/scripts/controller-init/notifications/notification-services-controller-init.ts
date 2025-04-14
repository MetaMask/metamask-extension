import { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import { ControllerInitFunction } from '../types';
import { type NotificationServicesControllerMessenger } from '../messengers/notifications';

export const NotificationServicesControllerInit: ControllerInitFunction<
  NotificationServicesController,
  NotificationServicesControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new NotificationServicesController({
    messenger: controllerMessenger,
    state: persistedState.NotificationServicesController,
    env: {
      featureAnnouncements: {
        platform: 'extension',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
        // eslint-disable-next-line no-restricted-globals
        spaceId: process.env.CONTENTFUL_ACCESS_SPACE_ID ?? '',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
        // eslint-disable-next-line no-restricted-globals
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? '',
      },
    },
  });

  return {
    controller,
  };
};
