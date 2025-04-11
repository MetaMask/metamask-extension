import {
  Controller as NotificationServicesPushController,
  defaultState,
} from '@metamask/notification-services-controller/push-services';
import {
  createRegToken,
  deleteRegToken,
  createSubscribeToPushNotifications,
} from '@metamask/notification-services-controller/push-services/web';

import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import {
  onPushNotificationClicked,
  onPushNotificationReceived,
} from '../../controllers/push-notifications';
import { type NotificationServicesPushControllerMessenger } from '../messengers/notifications';
import type { ControllerInitFunction } from '../types';

export const NotificationServicesPushControllerInit: ControllerInitFunction<
  NotificationServicesPushController,
  NotificationServicesPushControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new NotificationServicesPushController({
    messenger: controllerMessenger,
    state: {
      ...defaultState,
      ...persistedState.NotificationServicesPushController,
    },
    env: {
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      apiKey: process.env.FIREBASE_API_KEY ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      projectId: process.env.FIREBASE_PROJECT_ID ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      appId: process.env.FIREBASE_APP_ID ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      measurementId: process.env.FIREBASE_MEASUREMENT_ID ?? '',
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      vapidKey: process.env.VAPID_KEY ?? '',
    },
    config: {
      isPushFeatureEnabled: isManifestV3,
      platform: 'extension',
      pushService: {
        createRegToken,
        deleteRegToken,
        subscribeToPushNotifications: createSubscribeToPushNotifications({
          messenger: controllerMessenger,
          onReceivedHandler: onPushNotificationReceived,
          // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
          onClickHandler: onPushNotificationClicked,
        }),
      },
    },
  });

  return {
    controller,
  };
};
