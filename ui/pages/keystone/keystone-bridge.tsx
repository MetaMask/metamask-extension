import React, { useCallback, useMemo } from 'react';

import { KeystoneWebUSBBridge } from '@keystonehq/metamask-keystone-webusb-bridge';
import { EventEmitter } from 'events';

export enum KeystoneEvent {
  TAB_READY = 'keystone-tab-ready',
  INIT = 'keystone-init',
  GET_KEYS = 'keystone-get-keys',
  SIGN_TRANSACTION = 'keystone-sign-transaction',
  SIGN_PERSONAL_MESSAGE = 'keystone-sign-personal-message',
  SIGN_EIP712_MESSAGE = 'keystone-sign-eip712-message',
}

export const KEYSTONE_TAB_TARGET = 'KEYSTONE-TAB';

class KeystoneBridgeImpl {
  private eventEmitter = new EventEmitter();
  private bridge: KeystoneWebUSBBridge | null = null;
  private isInitialized = false;
  private mfp: string | undefined = undefined;

  constructor() {
    this.addEventListener();
    this.sendMessageToExtension({
      action: `${KeystoneEvent.TAB_READY}`,
      success: true,
    });
  }

  init() {
    this.bridgeInit();
  }

  registerInit(mfp: string, messageId: string) {
    this.mfp = mfp;
    this.eventEmitter.once(KeystoneEvent.INIT, (event) => {
      const { success, error } = event;
      clearTimeout(timeout);
      this.sendMessageToExtension({
        action: `${KeystoneEvent.INIT}-reply`,
        success,
        error,
        messageId,
      });
    });
    const timeout = setTimeout(() => {
      this.sendMessageToExtension({
        action: `${KeystoneEvent.INIT}-reply`,
        success: false,
        error: 'Keystone WebUSB bridge initialization timed out',
        messageId,
      });
    }, 10000);
  }

  addEventListener() {
    window.addEventListener('message', async (event) => {
      if (event && event.data && event.data.target === KEYSTONE_TAB_TARGET) {
        const { action, params, messageId } = event.data;
        const replyAction = `${action}-reply`;
        console.log('event', event.data);
        try {
          switch (action) {
            case KeystoneEvent.INIT:
              this.registerInit(params.mfp, messageId);
              break;
            case KeystoneEvent.GET_KEYS:
              await this.getKeys(params, replyAction, messageId);
              break;
            case KeystoneEvent.SIGN_TRANSACTION:
              await this.signTransaction(params, replyAction, messageId);
              break;
            case KeystoneEvent.SIGN_PERSONAL_MESSAGE:
              await this.signPersonalMessage(params, replyAction, messageId);
              break;
            case KeystoneEvent.SIGN_EIP712_MESSAGE:
              await this.signEIP712Message(params, replyAction, messageId);
              break;
          }
        } catch (error: any) {
          this.sendMessageToExtension({
            action: replyAction,
            success: false,
            messageId,
            error: error.message,
          });
        }
      }
    });
  }

  async bridgeInit() {
    if (!this.isInitialized) {
      try {
        this.bridge = new KeystoneWebUSBBridge();
        await this.bridge.init(this.mfp);
        this.isInitialized = true;
        this.eventEmitter.emit(KeystoneEvent.INIT, {
          success: true,
        });
      } catch (error: any) {
        console.error('Keystone WebUSB bridge initialization failed', error);
        this.eventEmitter.emit(KeystoneEvent.INIT, {
          success: false,
          error: error.message,
        });
      }
    }
  }

  async getKeys(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error('Bridge not initialized. Please call init first.');
    }

    const { paths } = params;
    const keys = await this.bridge.getKeys(paths);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: keys,
      messageId,
    });
  }

  async signTransaction(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error('Bridge not initialized. Please call init first.');
    }

    const { path, rawTx, isLegacyTx } = params;
    const signature = await this.bridge.signTransaction(
      path,
      rawTx,
      isLegacyTx,
    );
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  async signPersonalMessage(
    params: any,
    replyAction: string,
    messageId: string,
  ) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error('Bridge not initialized. Please call init first.');
    }

    const { path, message } = params;
    const signature = await this.bridge.signPersonalMessage(path, message);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  async signEIP712Message(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error('Bridge not initialized. Please call init first.');
    }

    const { path, jsonMessage } = params;
    const signature = await this.bridge.signEIP712Message(path, jsonMessage);
    console.log('signature', signature);
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  sendMessageToExtension(msg: any) {
    console.log('sendMessageToExtension', msg);
    console.log('window.opener', window.opener);
    window.opener.postMessage(msg, '*');
  }
}

const KeystoneBridge = () => {
  const keystoneBridge = useMemo(() => new KeystoneBridgeImpl(), []);
  const handleInit = useCallback(() => {
    keystoneBridge.init();
  }, []);
  return (
    <div className="main-container ">
      <div className="keystone-usb-bridge__container">
        <div className="keystone-usb-bridge__header">
          <h1>Keystone USB Bridge</h1>
        </div>
        <div className="keystone-usb-bridge__content">
          <button onClick={handleInit}>Connect</button>
        </div>
      </div>
    </div>
  );
};

export default KeystoneBridge;
