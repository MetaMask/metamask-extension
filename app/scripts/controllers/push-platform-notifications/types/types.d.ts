export declare interface Messaging {
  app: FirebaseApp;
}

export declare interface FirebaseApp {
  readonly name: string;
  readonly options: FirebaseOptions;
  automaticDataCollectionEnabled: boolean;
}

export declare interface FirebaseOptions {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface NotificationPayload {
  title?: string;
  body?: string;
  image?: string;
  icon?: string;
}

export interface MessagePayload {
  notification?: NotificationPayload;
  data?: { [key: string]: string };
  fcmOptions?: FcmOptions;
  from: string;
  collapseKey: string;
  messageId: string;
}

export interface GetTokenOptions {
  vapidKey?: string;
  serviceWorkerRegistration?: ServiceWorkerRegistration;
}