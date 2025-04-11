import { isObject } from '@metamask/utils';
import { OffscreenCommunicationTarget } from '../../shared/constants/offscreen-communication';

export default function setupLocalStorageMessageListeners() {
  chrome.runtime.onMessage.addListener(
    (
      message: {
        target: string;
        action: string;
        key: string;
        value: string;
      },
      _sender,
    ) => {
      if (
        message &&
        isObject(message) &&
        message.action &&
        message.key &&
        message.target === OffscreenCommunicationTarget.localStorageOffScreen
      ) {
        if (message.action === 'getItem') {
          const storedValue = window.localStorage.getItem(message.key);
          chrome.runtime.sendMessage({
            target: OffscreenCommunicationTarget.extensionLocalStorage,
            value: storedValue,
          });
        } else if (message.action === 'setItem') {
          window.localStorage.setItem(message.key, message.value);
        } else if (message.action === 'removeItem') {
          window.localStorage.removeItem(message.key);
        }
      }
    },
  );
}
