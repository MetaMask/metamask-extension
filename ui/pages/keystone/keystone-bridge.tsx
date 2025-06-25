import React, { useCallback, useMemo, useState } from 'react';
import LogoKeystone from './keystoneLogo';
import LogoMetamask from './metamaskLogo';
import { KeystoneWebUSBBridge } from '@keystonehq/metamask-keystone-webusb-bridge';
import { EventEmitter } from 'events';

export enum KeystoneEvent {
  TAB_READY = 'keystone-tab-ready',
  INIT = 'keystone-init',
  GET_KEYS = 'keystone-get-keys',
  SIGN_TRANSACTION = 'keystone-sign-transaction',
  SIGN_PERSONAL_MESSAGE = 'keystone-sign-personal-message',
  SIGN_EIP712_MESSAGE = 'keystone-sign-eip712-message',
  DISPOSE = 'keystone-dispose',
}

export const KEYSTONE_TAB_TARGET = 'KEYSTONE-TAB';

enum Errors {
  INIT_TIMEOUT = 'Keystone WebUSB bridge initialization timed out',
}

const DEFAULT_CONTENT = 'Ensure Your Keystone 3 Pro is on the homepage';

const EventTitles = {
  [KeystoneEvent.GET_KEYS]: 'Export Public Key',
  [KeystoneEvent.SIGN_TRANSACTION]: 'Sign Transaction',
  [KeystoneEvent.SIGN_PERSONAL_MESSAGE]: 'Sign Personal Message',
  [KeystoneEvent.SIGN_EIP712_MESSAGE]: 'Sign EIP-712 Message',
};

enum InternalEvents {
  GETTING_KEYS = 'getting-keys',
  WAITING_FOR_COMMAND = 'waiting-for-command',
}

const EventContents = {
  [KeystoneEvent.GET_KEYS]:
    'Connecting to your Keystone, please confirm on your device',
  [InternalEvents.GETTING_KEYS]: 'Getting your account, please wait...',
  [InternalEvents.WAITING_FOR_COMMAND]:
    'Keystone connected, waiting for command',
  [KeystoneEvent.SIGN_TRANSACTION]: 'Signing transaction',
  [KeystoneEvent.SIGN_PERSONAL_MESSAGE]: 'Signing personal message',
  [KeystoneEvent.SIGN_EIP712_MESSAGE]: 'Signing EIP-712 message',
};

class KeystoneBridgeImpl {
  private eventEmitter = new EventEmitter();
  private bridge: KeystoneWebUSBBridge | null = null;
  private isInitialized = false;
  private mfp: string | undefined = undefined;
  private setTitle: (title: string) => void;
  private setContent: (content: string) => void;
  private setError: (error: string) => void;
  private setButtonText: (buttonText: string) => void;
  private setButtonLoading: (buttonLoading: boolean) => void;
  private setShowButton: (showButton: boolean) => void;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private initMessageId: string | null = null;
  private extensionTabId: number = 0;

  constructor({
    setTitle,
    setContent,
    setError,
    setButtonText,
    setButtonLoading,
    setShowButton,
  }: {
    setTitle: (title: string) => void;
    setContent: (content: string) => void;
    setError: (error: string) => void;
    setButtonText: (buttonText: string) => void;
    setButtonLoading: (buttonLoading: boolean) => void;
    setShowButton: (showButton: boolean) => void;
  }) {
    this.addEventListener();
    this.sendMessageToExtension({
      action: `${KeystoneEvent.TAB_READY}`,
      success: true,
    });

    this.setTitle = setTitle.bind(this);
    this.setContent = setContent.bind(this);
    this.setError = setError.bind(this);
    this.setButtonText = setButtonText.bind(this);
    this.setButtonLoading = setButtonLoading.bind(this);
    this.setShowButton = setShowButton.bind(this);
  }

  init() {
    this.bridgeInit();
    this.connectionTimeout = setTimeout(() => {
      this.setError(Errors.INIT_TIMEOUT);
      this.sendMessageToExtension({
        action: `${KeystoneEvent.INIT}-reply`,
        success: false,
        error: Errors.INIT_TIMEOUT,
        messageId: this.initMessageId,
      });
    }, 10000);
  }

  registerInit(mfp: string, messageId: string) {
    this.mfp = mfp;
    this.initMessageId = messageId;
    this.eventEmitter.once(KeystoneEvent.INIT, (event) => {
      const { success, error } = event;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      if (success) {
        this.setShowButton(false);
        this.setContent(EventContents[InternalEvents.WAITING_FOR_COMMAND]);
      }
      this.sendMessageToExtension({
        action: `${KeystoneEvent.INIT}-reply`,
        success,
        error,
        messageId,
      });
    });
  }

  addEventListener() {
    window.addEventListener('message', async (event) => {
      if (event && event.data && event.data.target === KEYSTONE_TAB_TARGET) {
        console.log('KeystoneBridge', event);
        const { action, params, messageId } = event.data;
        const replyAction = `${action}-reply`;
        try {
          switch (action) {
            case KeystoneEvent.INIT:
              this.extensionTabId = params.extensionTabId;
              this.registerInit(params.mfp, messageId);
              break;
            case KeystoneEvent.GET_KEYS:
              this.setTitle(EventTitles[KeystoneEvent.GET_KEYS]);
              this.setContent(EventContents[KeystoneEvent.GET_KEYS]);
              await this.getKeys(params, replyAction, messageId);
              this.setContent(
                EventContents[InternalEvents.WAITING_FOR_COMMAND],
              );
              this.dispose();
              break;
            case KeystoneEvent.SIGN_TRANSACTION:
              this.setTitle(EventTitles[KeystoneEvent.SIGN_TRANSACTION]);
              this.setContent(EventContents[KeystoneEvent.SIGN_TRANSACTION]);
              await this.signTransaction(params, replyAction, messageId);
              this.setContent(
                EventContents[InternalEvents.WAITING_FOR_COMMAND],
              );
              this.dispose();
              break;
            case KeystoneEvent.SIGN_PERSONAL_MESSAGE:
              this.setTitle(EventTitles[KeystoneEvent.SIGN_PERSONAL_MESSAGE]);
              this.setContent(
                EventContents[KeystoneEvent.SIGN_PERSONAL_MESSAGE],
              );
              await this.signPersonalMessage(params, replyAction, messageId);
              this.setContent(
                EventContents[InternalEvents.WAITING_FOR_COMMAND],
              );
              this.dispose();
              break;
            case KeystoneEvent.SIGN_EIP712_MESSAGE:
              this.setTitle(EventTitles[KeystoneEvent.SIGN_EIP712_MESSAGE]);
              this.setContent(EventContents[KeystoneEvent.SIGN_EIP712_MESSAGE]);
              await this.signEIP712Message(params, replyAction, messageId);
              this.setContent(
                EventContents[InternalEvents.WAITING_FOR_COMMAND],
              );
              this.dispose();
              break;
            case KeystoneEvent.DISPOSE:
              this.dispose();
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

  dispose() {
    setTimeout(() => {
      window.close();
    }, 1000);
  }

  async switchToExtensionTab() {
    if (this.extensionTabId) {
      await chrome.tabs.update(this.extensionTabId, { active: true });
    }
  }

  async bridgeInit() {
    try {
      if (!this.isInitialized) {
        this.bridge = new KeystoneWebUSBBridge();
        await this.bridge.init(this.mfp);
        this.isInitialized = true;
      }
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

  async getKeys(params: any, replyAction: string, messageId: string) {
    if (!this.bridge || !this.isInitialized) {
      throw new Error('Bridge not initialized. Please call init first.');
    }

    const { paths } = params;
    const results = [];
    for (const path of paths) {
      const result = await this.bridge.getKeys([path]);
      this.setContent(EventContents[InternalEvents.GETTING_KEYS]);
      results.push(result);
    }
    const keys = {
      mfp: results[0].mfp,
      keys: results.map((result) => result.keys[0]),
    };
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
    this.sendMessageToExtension({
      action: replyAction,
      success: true,
      payload: signature,
      messageId,
    });
  }

  sendMessageToExtension(msg: any) {
    window.opener.postMessage(msg, '*');
  }
}

const KeystoneBridge = () => {
  const [title, setTitle] = useState('Export Public Key');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [error, setError] = useState('');
  const [showButton, setShowButton] = useState(true);
  const [buttonText, setButtonText] = useState('Pair with my Keystone 3 Pro');
  const [buttonLoading, setButtonLoading] = useState(false);

  const keystoneBridge = useMemo(
    () =>
      new KeystoneBridgeImpl({
        setTitle,
        setContent,
        setError,
        setButtonText,
        setButtonLoading,
        setShowButton,
      }),
    [],
  );
  const handleInit = useCallback(() => {
    keystoneBridge.init();
  }, []);
  return (
    <div className="main-container ">
      <div className="keystone-usb-bridge__container">
        <div className="keystone-usb-bridge__header">
          <div className="keystone-usb-bridge__header-title-wrapper">
            <LogoKeystone width="200px" />
            <div className="keystone-usb-bridge__header-title-wrapper-text">
              <h1 className="keystone-usb-bridge__header-title">{title}</h1>
              <LogoMetamask width="100px" />
            </div>
          </div>
        </div>
        <div className="keystone-usb-bridge__content">
          <div className="keystone-usb-bridge__content-wrapper">
            <div className="keystone-usb-bridge__content-text">{content}</div>
            {showButton && (
              <button
                className="keystone-usb-bridge__content-button"
                onClick={handleInit}
                disabled={buttonLoading}
              >
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeystoneBridge;
