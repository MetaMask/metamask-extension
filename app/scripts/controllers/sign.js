import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import { TypedMessageManager } from '@metamask/message-manager';

export default class SignController extends EventEmitter {
  constructor({ keyringController, sendUpdate, showPopup }) {
    super();

    this.memStore = new ObservableStore({
      unapprovedTypedMessages: {},
      unapprovedTypedMessagesCount: 0,
    });

    this.resetState = () => {
      this.memStore.updateState({
        unapprovedTypedMessages: {},
        unapprovedTypedMessagesCount: 0,
      });
    };

    this._keyringController = keyringController;
    this._sendUpdate = sendUpdate;
    this._showPopup = showPopup;
    this._typedMessageManager = new TypedMessageManager();

    this._typedMessageManager.hub.on('updateBadge', () => {
      this.emit('updateBadge');
    });

    this._typedMessageManager.subscribe((state) => {
      this.memStore.updateState({
        unapprovedTypedMessages: this._migrateMessages(
          state.unapprovedMessages,
        ),
        unapprovedTypedMessagesCount: state.unapprovedMessagesCount,
      });
    });
  }

  get unapprovedTypedMessagesCount() {
    return this._typedMessageManager.getUnapprovedMessagesCount();
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

  async signTypedMessage(msgParams) {
    const { version } = msgParams;

    await this._signAbstractMessage(
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

  cancelTypedMessage(msgId) {
    this._cancelAbstractMessage(this._typedMessageManager, msgId);
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
      return this.getState();
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
}
