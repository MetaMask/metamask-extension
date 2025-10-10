import {
  Controller as NotificationServicesPushController,
  defaultState,
} from '@metamask/notification-services-controller/push-services';
import {
  createRegToken,
  deleteRegToken,
  createSubscribeToPushNotifications,
} from '@metamask/notification-services-controller/push-services/web';
import { hasProperty } from '@metamask/utils';
import { ControllerInitFunction } from '../types';
import type {
  NotificationServicesPushControllerMessenger,
  NotificationServicesPushControllerInitMessenger,
} from '../messengers/notifications';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import {
  onPushNotificationClicked,
  onPushNotificationReceived,
} from '../../controllers/push-notifications';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

/**
 * normalises the extension locale path to use hyphens ('-') instead of underscores ('_')
 *
 * @param locale - extension locale
 * @returns normalised locale
 */
export const getNormalisedLocale = (locale: string): string =>
  locale.replace('_', '-');

export const NotificationServicesPushControllerInit: ControllerInitFunction<
  NotificationServicesPushController,
  NotificationServicesPushControllerMessenger,
  NotificationServicesPushControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState, getController }) => {
  const controller = new NotificationServicesPushController({
    messenger: controllerMessenger,
    state: {
      ...defaultState,
      ...persistedState.NotificationServicesPushController,
    },
    env: {
      apiKey: process.env.FIREBASE_API_KEY ?? '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
      projectId: process.env.FIREBASE_PROJECT_ID ?? '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.FIREBASE_APP_ID ?? '',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID ?? '',
      vapidKey: process.env.VAPID_KEY ?? '',
    },
    config: {
      isPushFeatureEnabled: isManifestV3 && !process.env.IN_TEST,
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
      getLocale: () =>
        getNormalisedLocale(
          getController('PreferencesController').state.currentLocale,
        ),
    },
  });

  initMessenger.subscribe(
    'NotificationServicesPushController:onNewNotifications',
    (notification) => {
      const chainId = hasProperty(notification, 'chain_id')
        ? (notification.chain_id as number)
        : null;

      initMessenger.call('MetaMetricsController:trackEvent', {
        category: MetaMetricsEventCategory.PushNotifications,
        event: MetaMetricsEventName.PushNotificationReceived,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          notification_id: notification.id,
          notification_type: notification.type,
          chain_id: chainId,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
    },
  );

  initMessenger.subscribe(
    'NotificationServicesPushController:pushNotificationClicked',
    (notification) => {
      const chainId = hasProperty(notification, 'chain_id')
        ? (notification.chain_id as number)
        : null;

      initMessenger.call('MetaMetricsController:trackEvent', {
        category: MetaMetricsEventCategory.PushNotifications,
        event: MetaMetricsEventName.PushNotificationClicked,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          notification_id: notification.id,
          notification_type: notification.type,
          chain_id: chainId,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
    },
  );

  return {
    controller,
  };
};
