import {
  Controller as NotificationServicesPushController,
  defaultState,
} from '@metamask/notification-services-controller/push-services';
import {
  createRegToken,
  deleteRegToken,
  createSubscribeToPushNotifications,
} from '@metamask/notification-services-controller/push-services/web';
import { ControllerInitFunction } from '../types';
import { type NotificationServicesPushControllerMessenger } from '../messengers/notifications';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import {
  onPushNotificationClicked,
  onPushNotificationReceived,
} from '../../controllers/push-notifications';

export const NotificationServicesPushControllerInit: ControllerInitFunction<
  NotificationServicesPushController,
  NotificationServicesPushControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const env = {
    apiKey: process.env.FIREBASE_API_KEY ?? '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.FIREBASE_APP_ID ?? '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID ?? '',
    vapidKey: process.env.VAPID_KEY ?? '',
  };

  const controller = new NotificationServicesPushController({
    messenger: controllerMessenger,
    state: {
      ...defaultState,
      ...persistedState.NotificationServicesPushController,
    },
    env,
    config: {
      isPushFeatureEnabled: isManifestV3,
      platform: 'extension',
      pushService: {
        createRegToken,
        deleteRegToken,
        subscribeToPushNotifications: createSubscribeToPushNotifications({
          messenger: controllerMessenger,
          onReceivedHandler: onPushNotificationReceived,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClickHandler: onPushNotificationClicked,
        }),
      },
    },
  });

  // Test example to run firebase and showcase this policy issue
  // We should get a token back from `createRegToken`, but instead we get `null`.
  console.log('TEST: START');
  createRegToken(env)
    .then((token) => console.log('TEST: HERE IS MY TOKEN', token))
    .catch((e) => console.log('TEST: FAILURE', e))
    .finally(() => console.log('TEST: END'));

  return {
    controller,
  };
};
