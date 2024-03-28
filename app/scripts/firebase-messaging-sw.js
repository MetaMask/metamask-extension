import { initializeFirebaseSW } from './controllers/push-platform-notifications/firebase/firebase-sw';

if (typeof window === 'undefined') {
  // If we are in a service worker, install Firebase
  initializeFirebaseSW();
}
