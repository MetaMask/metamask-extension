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
        spaceId: process.env.CONTENTFUL_ACCESS_SPACE_ID ?? ':spaceId',
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? ':accessToken',
      },
    },
  });

  return {
    controller,
  };
};
