import { Controller as NotificationServicesController } from '@metamask/notification-services-controller/notification-services';
import { ControllerInitFunction } from '../types';
import { type NotificationServicesControllerMessenger } from '../messengers/notifications';
import packageJson from '../../../../package.json';

const APP_VERSION = packageJson.version;

const getNormalisedLocale = (locale: string): string =>
  locale.replace('_', '-');

export const NotificationServicesControllerInit: ControllerInitFunction<
  NotificationServicesController,
  NotificationServicesControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const controller = new NotificationServicesController({
    messenger: controllerMessenger,
    state: persistedState.NotificationServicesController,
    env: {
      featureAnnouncements: {
        platform: 'extension',
        spaceId: process.env.CONTENTFUL_ACCESS_SPACE_ID ?? ':spaceId',
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? ':accessToken',
        platformVersion: APP_VERSION,
      },
      locale: () =>
        getNormalisedLocale(
          getController('PreferencesController').state.currentLocale,
        ),
    },
  });

  return {
    controller,
  };
};
