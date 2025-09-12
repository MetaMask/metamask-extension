import _ from 'lodash';
import {
  OffscreenCommunicationTarget,
  KnownOrigins,
  KeystoneAction,
} from '../../shared/constants/offscreen-communication';
import { CallbackProcessor } from './callback-processor';

enum KeystoneEvent {
  init = 'keystone-init',
  getKeys = 'keystone-get-keys',
  signTransaction = 'keystone-sign-transaction',
  signPersonalMessage = 'keystone-sign-personal-message',
  signEIP712Message = 'keystone-sign-eip712-message',
}

enum KeystoneReply {
  tab_ready = 'keystone-tab-ready',
  init = 'keystone-init-reply',
  getKeys = 'keystone-get-keys-reply',
  signTransaction = 'keystone-sign-transaction-reply',
  signPersonalMessage = 'keystone-sign-personal-message-reply',
  signEIP712Message = 'keystone-sign-eip712-message-reply',
}

const KEYSTONE_TAB_TARGET = 'KEYSTONE-TAB';

const callbackProcessor = new CallbackProcessor();

async function openConnectorTab(url: string) {
  const browserTab = window.open(url);
  if (!browserTab) {
    throw new Error('Failed to open Keystone connector.');
  }

  return browserTab;
}

const setupKeystoneTabEventListener = (
  tab: Window,
  sendResponse: any,
  mfp?: string,
  extensionTabId?: number,
) => {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== tab) {
      return;
    }
    const { action } = event.data;

    switch (action) {
      case KeystoneReply.tab_ready:
        const messageId = callbackProcessor.registerCallback(sendResponse);
        tab.postMessage(
          {
            action: KeystoneAction.init,
            messageId,
            target: KEYSTONE_TAB_TARGET,
            params: { mfp, extensionTabId },
          },
          '*',
        );
        break;
      default:
        callbackProcessor.processCallback(event.data);
        break;
    }
  });
};

export default async function init() {
  let initialized = false;
  let browserTab: Window | null = null;
  //message from offscreen bridge
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.target !== OffscreenCommunicationTarget.keystoneOffscreen) {
      return;
    }

    switch (msg.action) {
      case KeystoneAction.init:
        if (!initialized) {
          openConnectorTab(msg.params.url).then((_browserTab) => {
            initialized = true;
            setupKeystoneTabEventListener(
              _browserTab,
              sendResponse,
              msg.params.mfp,
              msg.params.extensionTabId,
            );
            browserTab = _browserTab;
            const listenInterval = setInterval(() => {
              console.log('Keystone init listenInterval', browserTab?.closed);
              if (browserTab?.closed) {
                console.log('Keystone init listenInterval clear');
                clearInterval(listenInterval);
                initialized = false;
                browserTab = null;
                sendResponse({
                  error: new Error('Keystone connector closed.'),
                });
              }
            }, 500);
          });
        } else {
          sendResponse({});
        }
        break;
      default:
        const messageId = callbackProcessor.registerCallback(sendResponse);
        browserTab?.postMessage(
          {
            ...msg,
            messageId,
            target: KEYSTONE_TAB_TARGET,
          },
          '*',
        );
        break;
    }
    // eslint-disable-next-line consistent-return
    return true;
  });
}
