import EventEmitter from 'events';
import log from 'loglevel';
import {
  Message,
  MessageManager,
  MessageParamsMetamask,
  PersonalMessage,
  PersonalMessageManager,
  PersonalMessageParamsMetamask,
  TypedMessage,
  TypedMessageManager,
  TypedMessageParamsMetamask,
} from '@metamask/message-manager';
import { ethErrors } from 'eth-rpc-errors';
import { bufferToHex } from 'ethereumjs-util';
import { KeyringController } from '@metamask/eth-keyring-controller';
import {
  AbstractMessageManager,
  AbstractMessage,
  MessageManagerState,
  AbstractMessageParams,
  AbstractMessageParamsMetamask,
  OriginalRequest,
} from '@metamask/message-manager/dist/AbstractMessageManager';
import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import PreferencesController from './preferences';

const controllerName = 'SignController';

const stateMetadata = {
  unapprovedMsgs: { persist: false, anonymous: false },
  unapprovedPersonalMsgs: { persist: false, anonymous: false },
  unapprovedTypedMessages: { persist: false, anonymous: false },
  unapprovedMsgCount: { persist: false, anonymous: false },
  unapprovedPersonalMsgCount: { persist: false, anonymous: false },
  unapprovedTypedMessagesCount: { persist: false, anonymous: false },
};

const getDefaultState = () => ({
  unapprovedMsgs: {},
  unapprovedPersonalMsgs: {},
  unapprovedTypedMessages: {},
  unapprovedMsgCount: 0,
  unapprovedPersonalMsgCount: 0,
  unapprovedTypedMessagesCount: 0,
});

// The BaseControllerV2 state template does not allow optional parameters
type StateMessage<M extends AbstractMessage> = Required<
  AbstractMessage | Exclude<M, AbstractMessage>
> & { msgParams: any; securityProviderResponse: any };

export type SignControllerState = {
  unapprovedMsgs: Record<string, StateMessage<Message>>;
  unapprovedPersonalMsgs: Record<string, StateMessage<PersonalMessage>>;
  unapprovedTypedMessages: Record<string, StateMessage<TypedMessage>>;
  unapprovedMsgCount: number;
  unapprovedPersonalMsgCount: number;
  unapprovedTypedMessagesCount: number;
};

export type GetSignState = {
  type: `${typeof controllerName}:getState`;
  handler: () => SignControllerState;
};

export type SignStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [SignControllerState, Patch[]];
};

export type SignControllerActions = GetSignState;

export type SignControllerEvents = SignStateChange;

export type SignControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  SignControllerActions,
  SignControllerEvents,
  never,
  never
>;

interface CoreMessage extends AbstractMessage {
  messageParams: AbstractMessageParams;
}

export default class SignController extends BaseControllerV2<
  typeof controllerName,
  SignControllerState,
  SignControllerMessenger
> {
  hub: EventEmitter;

  private _keyringController: KeyringController;

  private _preferencesController: PreferencesController;

  private _sendUpdate: () => void;

  private _showPopup: () => void;

  private _getState: () => any;

  private _messageManager: MessageManager;

  private _personalMessageManager: PersonalMessageManager;

  private _typedMessageManager: TypedMessageManager;

  private _messageManagers: AbstractMessageManager<any, any, any>[];

  private _securityProviderRequest: (
    requestData: any,
    methodName: string,
  ) => Promise<any>;

  constructor({
    messenger,
    keyringController,
    preferencesController,
    sendUpdate,
    showPopup,
    getState,
    securityProviderRequest,
  }: {
    messenger: SignControllerMessenger;
    keyringController: KeyringController;
    preferencesController: PreferencesController;
    sendUpdate: () => void;
    showPopup: () => void;
    getState: () => any;
    securityProviderRequest: (
      requestData: any,
      methodName: string,
    ) => Promise<any>;
  }) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });

    this._keyringController = keyringController;
    this._preferencesController = preferencesController;
    this._sendUpdate = sendUpdate;
    this._showPopup = showPopup;
    this._getState = getState;
    this._securityProviderRequest = securityProviderRequest;

    this._messageManager = new MessageManager();
    this._personalMessageManager = new PersonalMessageManager();
    this._typedMessageManager = new TypedMessageManager();
    this.hub = new EventEmitter();

    this._messageManagers = [
      this._messageManager,
      this._personalMessageManager,
      this._typedMessageManager,
    ];

    this._messageManagers.forEach((messageManager) =>
      this.bubbleEvents(messageManager),
    );

    this.subscribeToMessageState(
      this._messageManager,
      (state) => state.unapprovedMsgs,
      (state, newMessages, messageCount) => {
        state.unapprovedMsgs = newMessages;
        state.unapprovedMsgCount = messageCount;
      },
    );

    this.subscribeToMessageState(
      this._personalMessageManager,
      (state) => state.unapprovedPersonalMsgs,
      (state, newMessages, messageCount) => {
        state.unapprovedPersonalMsgs = newMessages;
        state.unapprovedPersonalMsgCount = messageCount;
      },
    );

    this.subscribeToMessageState(
      this._typedMessageManager,
      (state) => state.unapprovedTypedMessages,
      (state, newMessages, messageCount) => {
        state.unapprovedTypedMessages = newMessages;
        state.unapprovedTypedMessagesCount = messageCount;
      },
    );
  }

  /**
   * A getter for the number of 'unapproved' Messages in this.messages
   *
   * @returns The number of 'unapproved' Messages in this.messages
   */
  get unapprovedMsgCount(): number {
    return this._messageManager.getUnapprovedMessagesCount();
  }

  /**
   * A getter for the number of 'unapproved' PersonalMessages in this.messages
   *
   * @returns The number of 'unapproved' PersonalMessages in this.messages
   */
  get unapprovedPersonalMessagesCount(): number {
    return this._personalMessageManager.getUnapprovedMessagesCount();
  }

  /**
   * A getter for the number of 'unapproved' TypedMessages in this.messages
   *
   * @returns The number of 'unapproved' TypedMessages in this.messages
   */
  get unapprovedTypedMessagesCount(): number {
    return this._typedMessageManager.getUnapprovedMessagesCount();
  }

  /**
   * Reset the controller state to the initial state.
   */
  resetState() {
    this.update((draftState) => {
      draftState.unapprovedMsgs = {};
      draftState.unapprovedPersonalMsgs = {};
      draftState.unapprovedTypedMessages = {};
      draftState.unapprovedMsgCount = 0;
      draftState.unapprovedPersonalMsgCount = 0;
      draftState.unapprovedTypedMessagesCount = 0;
    });
  }

  /**
   * Called when a Dapp uses the eth_sign method, to request user approval.
   * eth_sign is a pure signature of arbitrary data. It is on a deprecation
   * path, since this data can be a transaction, or can leak private key
   * information.
   *
   * @param msgParams - The params passed to eth_sign.
   * @param [req] - The original request, containing the origin.
   */
  async newUnsignedMessage(
    msgParams: MessageParamsMetamask,
    req: OriginalRequest,
  ) {
    const {
      // eslint-disable-next-line camelcase
      disabledRpcMethodPreferences: { eth_sign },
    } = this._preferencesController.store.getState() as any;

    // eslint-disable-next-line camelcase
    if (!eth_sign) {
      throw ethErrors.rpc.methodNotFound(
        'eth_sign has been disabled. You must enable it in the advanced settings',
      );
    }

    const data = this.normalizeMsgData(msgParams.data);

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
   * @param msgParams - The params of the message to sign & return to the Dapp.
   * @param req - The original request, containing the origin.
   */
  async newUnsignedPersonalMessage(
    msgParams: PersonalMessageParamsMetamask,
    req: OriginalRequest,
  ) {
    const promise = this._personalMessageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
    );
    this._sendUpdate();
    this._showPopup();
    return promise;
  }

  /**
   * Called when a dapp uses the eth_signTypedData method, per EIP 712.
   *
   * @param msgParams - The params passed to eth_signTypedData.
   * @param req - The original request, containing the origin.
   * @param version
   */
  async newUnsignedTypedMessage(
    msgParams: TypedMessageParamsMetamask,
    req: OriginalRequest,
    version: string,
  ) {
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
   * @param msgParams - The params passed to eth_call.
   * @returns Full state update.
   */
  async signMessage(msgParams: MessageParamsMetamask) {
    return await this.signAbstractMessage(
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
   * @param msgParams - The params of the message to sign & return to the Dapp.
   * @returns A full state update.
   */
  async signPersonalMessage(msgParams: PersonalMessageParamsMetamask) {
    return await this.signAbstractMessage(
      this._personalMessageManager,
      'signPersonalMessage',
      msgParams,
      async (cleanMsgParams) =>
        await this._keyringController.signPersonalMessage(cleanMsgParams),
    );
  }

  /**
   * The method for a user approving a call to eth_signTypedData, per EIP 712.
   * Triggers the callback in newUnsignedTypedMessage.
   *
   * @param msgParams - The params passed to eth_signTypedData.
   * @returns Full state update.
   */
  async signTypedMessage(msgParams: TypedMessageParamsMetamask) {
    const { version } = msgParams;

    return await this.signAbstractMessage(
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
   * @param msgId - The id of the message to cancel.
   */
  cancelMessage(msgId: string) {
    this.cancelAbstractMessage(this._messageManager, msgId);
  }

  /**
   * Used to cancel a personal_sign type message.
   *
   * @param msgId - The ID of the message to cancel.
   */
  cancelPersonalMessage(msgId: string) {
    this.cancelAbstractMessage(this._personalMessageManager, msgId);
  }

  /**
   * Used to cancel a eth_signTypedData type message.
   *
   * @param msgId - The ID of the message to cancel.
   */
  cancelTypedMessage(msgId: string) {
    this.cancelAbstractMessage(this._typedMessageManager, msgId);
  }

  /**
   * Reject all unapproved messages of any type.
   */
  rejectUnapproved() {
    this._messageManagers.forEach((messageManager) =>
      Object.keys(messageManager.getUnapprovedMessages()).forEach((messageId) =>
        messageManager.rejectMessage(messageId),
      ),
    );
  }

  private async signAbstractMessage<
    M extends AbstractMessage,
    P extends AbstractMessageParams,
    PM extends AbstractMessageParamsMetamask,
  >(
    messageManager: AbstractMessageManager<M, P, PM>,
    methodName: string,
    msgParams: PM,
    getSignature: (cleanMessageParams: P) => any,
  ) {
    log.info(`MetaMaskController - ${methodName}`);
    const messageId = msgParams.metamaskId as string;
    try {
      const cleanMessageParams = await messageManager.approveMessage(msgParams);
      const signature = await getSignature(cleanMessageParams);
      messageManager.setMessageStatusSigned(messageId, signature);
      return this._getState();
    } catch (error) {
      log.info(`MetaMaskController - ${methodName} failed.`, error);
      this._typedMessageManager.setMessageStatusErrored(
        messageId,
        String(error),
      );
      throw error;
    }
  }

  private cancelAbstractMessage<
    M extends AbstractMessage,
    P extends AbstractMessageParams,
    PM extends AbstractMessageParamsMetamask,
  >(messageManager: AbstractMessageManager<M, P, PM>, messageId: string) {
    messageManager.rejectMessage(messageId);
    return this._getState();
  }

  private bubbleEvents<
    M extends AbstractMessage,
    P extends AbstractMessageParams,
    PM extends AbstractMessageParamsMetamask,
  >(messageManager: AbstractMessageManager<M, P, PM>) {
    messageManager.hub.on('updateBadge', () => {
      this.hub.emit('updateBadge');
    });
  }

  private subscribeToMessageState<
    M extends AbstractMessage,
    P extends AbstractMessageParams,
    PM extends AbstractMessageParamsMetamask,
  >(
    messageManager: AbstractMessageManager<M, P, PM>,
    getExistingMessages: (
      state: SignControllerState,
    ) => Record<string, StateMessage<M>>,
    updateState: (
      state: SignControllerState,
      newMessages: Record<string, StateMessage<M>>,
      messageCount: number,
    ) => void,
  ) {
    messageManager.subscribe(async (state: MessageManagerState<M>) => {
      const existingMessages = getExistingMessages(this.state);

      const newMessages = await this.migrateMessages(
        state.unapprovedMessages as any,
        existingMessages,
      );

      this.update((draftState) => {
        updateState(draftState, newMessages, state.unapprovedMessagesCount);
      });
    });
  }

  private async migrateMessages<M extends AbstractMessage>(
    coreMessages: Record<string, CoreMessage>,
    existingMessages: Record<string, StateMessage<M>>,
  ): Promise<Record<string, StateMessage<M>>> {
    const stateMessages: Record<string, StateMessage<M>> = {};

    for (const messageId of Object.keys(coreMessages)) {
      const coreMessage = coreMessages[messageId];

      const stateMessage = await this.migrateMessage(
        coreMessage,
        existingMessages,
      );

      stateMessages[messageId] = stateMessage;
    }

    return stateMessages;
  }

  private async migrateMessage<M extends AbstractMessage>(
    coreMessage: CoreMessage,
    existingMessages: Record<string, StateMessage<M>>,
  ): Promise<StateMessage<M>> {
    const { messageParams, ...originalMessageData } = coreMessage;

    // Core message managers use messageParams but frontend uses msgParams with lots of references
    const newMessage = {
      ...originalMessageData,
      msgParams: coreMessage.messageParams,
    };

    const { id: messageId } = coreMessage;
    const existingMessage = existingMessages[messageId];

    const securityProviderResponse = existingMessage
      ? existingMessage.securityProviderResponse
      : await this._securityProviderRequest(newMessage, newMessage.type);

    // rawSig is optional in the core message but BaseControllerV2 does not allow optional state
    const rawSig = newMessage.rawSig as string;

    return { ...newMessage, securityProviderResponse, rawSig };
  }

  private normalizeMsgData(data: string) {
    if (data.slice(0, 2) === '0x') {
      // data is already hex
      return data;
    }
    // data is unicode, convert to hex
    return bufferToHex(Buffer.from(data, 'utf8'));
  }
}
