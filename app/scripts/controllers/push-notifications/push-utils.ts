import { type INotification } from '@metamask/notification-services-controller/notification-services';
import { type PushNotificationEnv } from '@metamask/notification-services-controller/push-services';
import { createSubscribeToPushNotifications } from '@metamask/notification-services-controller/push-services/web';

import type { FirebaseApp } from 'firebase/app';
import { getApp, initializeApp } from 'firebase/app';
import { onMessage } from 'firebase/messaging';
import { getMessaging, isSupported } from 'firebase/messaging/sw';
import type { Messaging } from 'firebase/messaging/sw';

// Stuff we never exported in the lib (since there was no need for it)
// But for this PoC we need it so we can subscribe to forground updates
let supportedCache: boolean | null = null;

const getPushAvailability = async () => {
  supportedCache ??= await isSupported();
  return supportedCache;
};

const createFirebaseApp = async (
  env: PushNotificationEnv,
): Promise<FirebaseApp> => {
  try {
    return getApp();
  } catch {
    const firebaseConfig = {
      apiKey: env.apiKey,
      authDomain: env.authDomain,
      storageBucket: env.storageBucket,
      projectId: env.projectId,
      messagingSenderId: env.messagingSenderId,
      appId: env.appId,
      measurementId: env.measurementId,
    };
    return initializeApp(firebaseConfig);
  }
};

const getFirebaseMessaging = async (
  env: PushNotificationEnv,
): Promise<Messaging | null> => {
  const supported = await getPushAvailability();
  if (!supported) {
    return null;
  }

  const app = await createFirebaseApp(env);
  return getMessaging(app);
};

export const createSubscription = (
  ...args: Parameters<typeof createSubscribeToPushNotifications>
) => {
  const subscribeFn = createSubscribeToPushNotifications(...args);
  const newSubscribeFn = async (env: PushNotificationEnv) => {
    const unsub1 = await subscribeFn(env);

    const messaging = getMessaging();
    const unsub2 = onMessage(messaging, (payload) => {
      console.log('ONMESSAGE CALLED');
      args[0].messenger.publish(
        'NotificationServicesPushController:onNewNotifications',
        {} as INotification,
      );
    });

    const unsub = () => {
      unsub1();
      unsub2();
    };

    return unsub;
  };

  return newSubscribeFn;
};
