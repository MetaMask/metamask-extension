import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import {
  MessageManager,
  PersonalMessageManager,
  TypedMessageManager,
} from '@metamask/message-manager';
import { ethErrors } from 'eth-rpc-errors';
import { bufferToHex } from 'ethereumjs-util';

export default class SignController extends EventEmitter {
  constructor({
    keyringController,
    preferencesController,
    sendUpdate,
    showPopup,
    getState,
  }) {
    super();

    this._keyringController = keyringController;
    this._preferencesController = preferencesController;
    this._sendUpdate = sendUpdate;
    this._showPopup = showPopup;
    this._getState = getState;

    const initialState = {
      unapprovedMsgs: {},
      unapprovedPersonalMsgs: {},
      unapprovedTypedMessages: {},
      unapprovedMsgCount: 0,
      unapprovedPersonalMsgCount: 0,
      unapprovedTypedMessagesCount: 0,
    };

    this.memStore = new ObservableStore(initialState);

    this.resetState = () => {
      this.memStore.updateState(initialState);
    };

    this._messageManager = new MessageManager();
    this._personalMessageManager = new PersonalMessageManager();
    this._typedMessageManager = new TypedMessageManager();

    this._messageManagers = [
      this._messageManager,
      this._personalMessageManager,
      this._typedMessageManager,
    ];

    this._messageManagers.forEach((messageManager) =>
      this._bubbleEvents(messageManager),
    );

    this._subscribeToMessageState(
      this._messageManager,
      'unapprovedMsgs',
      'unapprovedMsgCount',
    );
    this._subscribeToMessageState(
      this._personalMessageManager,
      'unapprovedPersonalMsgs',
      'unapprovedPersonalMsgCount',
    );
    this._subscribeToMessageState(
      this._typedMessageManager,
      'unapprovedTypedMessages',
      'unapprovedTypedMessagesCount',
    );
  }

  /**
   * A getter for the number of 'unapproved' Messages in this.messages
   *
   * @returns {number} The number of 'unapproved' Messages in this.messages
   */
  get unapprovedMsgCount() {
    return this._messageManager.getUnapprovedMessagesCount();
  }

  get unapprovedPersonalMessagesCount() {
    return this._personalMessageManager.getUnapprovedMessagesCount();
  }

  get unapprovedTypedMessagesCount() {
    return this._typedMessageManager.getUnapprovedMessagesCount();
  }

  /**
   * Called when a Dapp uses the eth_sign method, to request user approval.
   * eth_sign is a pure signature of arbitrary data. It is on a deprecation
   * path, since this data can be a transaction, or can leak private key
   * information.
   *
   * @param {object} msgParams - The params passed to eth_sign.
   * @param {object} [req] - The original request, containing the origin.
   */
  async newUnsignedMessage(msgParams, req) {
    const {
      // eslint-disable-next-line camelcase
      disabledRpcMethodPreferences: { eth_sign },
    } = this._preferencesController.store.getState();

    // eslint-disable-next-line camelcase
    if (!eth_sign) {
      throw ethErrors.rpc.methodNotFound(
        'eth_sign has been disabled. You must enable it in the advanced settings',
      );
    }

    const data = this._normalizeMsgData(msgParams.data);

    // 64 hex + "0x" at the beginning
    // This is needed because Ethereum's EcSign works only on 32 byte numbers
    // For 67 length see: https://github.com/MetaMask/metamask-extension/pull/12679/files#r749479607
    if (data.length === 66 || data.length === 67) {
      const promise = this._messageManager.addUnapprovedMessageAsync(
        msgParams,
        req,
      );
      this._sendUpdate();
      this._showPopup();
      return await promise;
    }

    throw ethErrors.rpc.invalidParams('eth_sign requires 32 byte message hash');
  }

  /**
   * Called when a dapp uses the personal_sign method.
   * This is identical to the Geth eth_sign method, and may eventually replace
   * eth_sign.
   *
   * We currently define our eth_sign and personal_sign mostly for legacy Dapps.
   *
   * @param {object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {object} [req] - The original request, containing the origin.
   */
  async newUnsignedPersonalMessage(msgParams, req) {
    const promise = this._personalMessageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
    );
    this._sendUpdate();
    this._showPopup();
    return promise;
  }

  async newUnsignedTypedMessage(msgParams, req, version) {
    const promise = this._typedMessageManager.addUnapprovedMessageAsync(
      msgParams,
      version,
      req,
    );
    this._sendUpdate();
    this._showPopup();
    return promise;
  }

  /**
   * Signifies user intent to complete an eth_sign method.
   *
   * @param {object} msgParams - The params passed to eth_call.
   * @returns {Promise<object>} Full state update.
   */
  async signMessage(msgParams) {
    return await this._signAbstractMessage(
      this._messageManager,
      'signMessage',
      msgParams,
      async (cleanMsgParams) =>
        await this._keyringController.signMessage(cleanMsgParams),
    );
  }

  /**
   * Signifies a user's approval to sign a personal_sign message in queue.
   * Triggers signing, and the callback function from newUnsignedPersonalMessage.
   *
   * @param {object} msgParams - The params of the message to sign & return to the Dapp.
   * @returns {Promise<object>} A full state update.
   */
  async signPersonalMessage(msgParams) {
    return await this._signAbstractMessage(
      this._personalMessageManager,
      'signPersonalMessage',
      msgParams,
      async (cleanMsgParams) =>
        await this._keyringController.signPersonalMessage(cleanMsgParams),
    );
  }

  async signTypedMessage(msgParams) {
    const { version } = msgParams;

    return await this._signAbstractMessage(
      this._typedMessageManager,
      'eth_signTypedData',
      msgParams,
      async (cleanMsgParams) => {
        // For some reason every version after V1 used stringified params.
        if (version !== 'V1') {
          // But we don't have to require that. We can stop suggesting it now:
          if (typeof cleanMsgParams.data === 'string') {
            cleanMsgParams.data = JSON.parse(cleanMsgParams.data);
          }
        }

        return await this._keyringController.signTypedMessage(cleanMsgParams, {
          version,
        });
      },
    );
  }

  /**
   * Used to cancel a message submitted via eth_sign.
   *
   * @param {string} msgId - The id of the message to cancel.
   */
  cancelMessage(msgId) {
    this._cancelAbstractMessage(this._messageManager, msgId);
  }

  /**
   * Used to cancel a personal_sign type message.
   *
   * @param {string} msgId - The ID of the message to cancel.
   */
  cancelPersonalMessage(msgId) {
    this._cancelAbstractMessage(this._personalMessageManager, msgId);
  }

  cancelTypedMessage(msgId) {
    this._cancelAbstractMessage(this._typedMessageManager, msgId);
  }

  rejectUnapproved() {
    this._messageManagers.forEach((messageManager) =>
      Object.keys(messageManager.getUnapprovedMessages()).forEach((messageId) =>
        messageManager.rejectMessage(messageId),
      ),
    );
  }

  async _signAbstractMessage(
    messageManager,
    methodName,
    msgParams,
    getSignature,
  ) {
    log.info(`MetaMaskController - ${methodName}`);
    const msgId = msgParams.metamaskId;
    try {
      const cleanMsgParams = await messageManager.approveMessage(msgParams);
      const signature = await getSignature(cleanMsgParams);
      messageManager.setMessageStatusSigned(msgId, signature);
      return this._getState();
    } catch (error) {
      log.info(`MetaMaskController - ${methodName} failed.`, error);
      this.typedMessageManager.setMessageStatusErrored(msgId, error);
      throw error;
    }
  }

  _cancelAbstractMessage(messageManager, msgId) {
    messageManager.rejectMessage(msgId);
    return this.getState();
  }

  _bubbleEvents(messageManager) {
    messageManager.hub.on('updateBadge', () => {
      this.emit('updateBadge');
    });
  }

  _subscribeToMessageState(
    messageManager,
    messagesPropertyName,
    countPropertyName,
  ) {
    messageManager.subscribe((state) => {
      this.memStore.updateState({
        [messagesPropertyName]: this._migrateMessages(state.unapprovedMessages),
        [countPropertyName]: state.unapprovedMessagesCount,
      });
    });
  }

  _migrateMessages(messages) {
    // Core message managers use messageParams but frontend has lots of references to msgParams
    return Object.keys(messages).reduce((result, messageId) => {
      const originalMessage = messages[messageId];
      result[messageId] = {
        ...originalMessage,
        msgParams: originalMessage.messageParams,
      };
      return result;
    }, {});
  }

  _normalizeMsgData(data) {
    if (data.slice(0, 2) === '0x') {
      // data is already hex
      return data;
    }
    // data is unicode, convert to hex
    return bufferToHex(Buffer.from(data, 'utf8'));
  }
}
