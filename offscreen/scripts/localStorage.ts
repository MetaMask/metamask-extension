import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { isObject } from '@metamask/utils';

export function setupLocalStorageMessageListeners() {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: string;
        key: string;
        value: string;
      },
      _sender,
      sendResponse,
    ) => {
      if (
        message &&
        isObject(message) &&
        message.action &&
        message.key &&
        message.target === OffscreenCommunicationTarget.localStorageOffscreen
      ) {
        if (message.action === 'getItem') {
          const storedValue = window.localStorage.getItem(key);
          chrome.runtime.sendMessage({
            target: OffscreenCommunicationTarget.extensionLocalStorage,
            value: storedValue,
          });          
        } else if (message.action === 'setItem') {
          window.localStorage.getItem(key, value);
        } else if (message.action === 'removeItem') {
          window.localStorage.removeItem(key);
        }
      }
    },
  );
}
