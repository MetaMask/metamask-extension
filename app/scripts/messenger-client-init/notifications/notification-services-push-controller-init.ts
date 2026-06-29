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
import { MessengerClientInitFunction } from '../types';
import type {
  NotificationServicesPushControllerMessenger,
  NotificationServicesPushControllerInitMessenger,
} from '../messengers/notifications';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import {
  onPushNotificationClicked,
  onPushNotificationReceived,
} from '../../controllers/push-notifications';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';

/**
 * normalises the extension locale path to use hyphens ('-') instead of underscores ('_')
 *
 * @param locale - extension locale
 * @returns normalised locale
 */
export const getNormalisedLocale = (locale: string): string =>
  locale.replace('_', '-');

export const NotificationServicesPushControllerInit: MessengerClientInitFunction<
  NotificationServicesPushController,
  NotificationServicesPushControllerMessenger,
  NotificationServicesPushControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  persistedState,
  getMessengerClient,
}) => {
  const messengerClient = new NotificationServicesPushController({
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
          getMessengerClient('PreferencesController').state.currentLocale,
        ),
    },
  });

  initMessenger.subscribe(
    'NotificationServicesPushController:onNewNotifications',
    (notification) => {
      const chainId = hasProperty(notification, 'chain_id')
        ? (notification.chain_id as number)
        : null;

      trackEvent(
        createEventBuilder(MetaMetricsEventName.PushNotificationReceived)
          .addCategory(MetaMetricsEventCategory.PushNotifications)
          .addProperties({
            /* eslint-disable @typescript-eslint/naming-convention */
            notification_id: notification.id,
            notification_type: notification.type,
            chain_id: chainId,
            /* eslint-enable @typescript-eslint/naming-convention */
          })
          .build({ environmentType: ENVIRONMENT_TYPE_BACKGROUND }),
      );
    },
  );

  initMessenger.subscribe(
    'NotificationServicesPushController:pushNotificationClicked',
    (notification) => {
      const otherNotificationProperties = () => {
        if (
          'notification_type' in notification &&
          notification.notification_type === 'on-chain' &&
          notification.payload?.chain_id
        ) {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          return { chain_id: notification.payload.chain_id };
        }

        return undefined;
      };

      trackEvent(
        createEventBuilder(MetaMetricsEventName.PushNotificationClicked)
          .addCategory(MetaMetricsEventCategory.PushNotifications)
          .addProperties({
            /* eslint-disable @typescript-eslint/naming-convention */
            notification_id: notification.id,
            notification_type: notification.type,
            ...otherNotificationProperties(),
            data: notification, // data blob for feature teams to analyse their notification shapes
            /* eslint-enable @typescript-eslint/naming-convention */
          })
          .build({ environmentType: ENVIRONMENT_TYPE_BACKGROUND }),
      );
    },
  );

  return {
    messengerClient,
  };
};
