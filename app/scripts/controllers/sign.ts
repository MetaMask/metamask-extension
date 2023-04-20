import EventEmitter from 'events';
import log from 'loglevel';
import {
  MessageManager,
  MessageParams,
  MessageParamsMetamask,
  PersonalMessageManager,
  PersonalMessageParams,
  PersonalMessageParamsMetamask,
  TypedMessageManager,
  TypedMessageParams,
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
import {
  AcceptRequest,
  AddApprovalRequest,
  RejectRequest,
} from '@metamask/approval-controller';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import PreferencesController from './preferences';

const controllerName = 'SignController';
const methodNameSign = MESSAGE_TYPE.ETH_SIGN;
const methodNamePersonalSign = MESSAGE_TYPE.PERSONAL_SIGN;
const methodNameTypedSign = MESSAGE_TYPE.ETH_SIGN_TYPED_DATA;

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

export type CoreMessage = AbstractMessage & {
  messageParams: AbstractMessageParams;
};

export type StateMessage = Required<AbstractMessage> & {
  msgParams: Required<AbstractMessageParams>;
  securityProviderResponse: any;
};

export type SignControllerState = {
  unapprovedMsgs: Record<string, StateMessage>;
  unapprovedPersonalMsgs: Record<string, StateMessage>;
  unapprovedTypedMessages: Record<string, StateMessage>;
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

type AllowedActions = AddApprovalRequest | AcceptRequest | RejectRequest;

export type SignControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  SignControllerActions | AllowedActions,
  SignControllerEvents,
  AllowedActions['type'],
  never
>;

export type SignControllerOptions = {
  messenger: SignControllerMessenger;
  keyringController: KeyringController;
  preferencesController: PreferencesController;
  sendUpdate: () => void;
  getState: () => any;
  metricsEvent: (payload: any, options?: any) => void;
  securityProviderRequest: (
    requestData: any,
    methodName: string,
  ) => Promise<any>;
};

/**
 * Controller for creating signing requests requiring user approval.
 */
export default class SignController extends BaseControllerV2<
  typeof controllerName,
  SignControllerState,
  SignControllerMessenger
> {
  hub: EventEmitter;

  private _keyringController: KeyringController;

  private _preferencesController: PreferencesController;

  private _getState: () => any;

  private _messageManager: MessageManager;

  private _personalMessageManager: PersonalMessageManager;

  private _typedMessageManager: TypedMessageManager;

  private _messageManagers: AbstractMessageManager<
    AbstractMessage,
    AbstractMessageParams,
    AbstractMessageParamsMetamask
  >[];

  private _metricsEvent: (payload: any, options?: any) => void;

  private _securityProviderRequest: (
    requestData: any,
    methodName: string,
  ) => Promise<any>;

  /**
   * Construct a Sign controller.
   *
   * @param options - The controller options.
   * @param options.messenger - The restricted controller messenger for the sign controller.
   * @param options.keyringController - An instance of a keyring controller used to perform the signing operations.
   * @param options.preferencesController - An instance of a preferences controller to limit operations based on user configuration.
   * @param options.getState - Callback to retrieve all user state.
   * @param options.metricsEvent - A function for emitting a metric event.
   * @param options.securityProviderRequest - A function for verifying a message, whether it is malicious or not.
   */
  constructor({
    messenger,
    keyringController,
    preferencesController,
    getState,
    metricsEvent,
    securityProviderRequest,
  }: SignControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });

    this._keyringController = keyringController;
    this._preferencesController = preferencesController;
    this._getState = getState;
    this._metricsEvent = metricsEvent;
    this._securityProviderRequest = securityProviderRequest;

    this.hub = new EventEmitter();
    this._messageManager = new MessageManager();
    this._personalMessageManager = new PersonalMessageManager();
    this._typedMessageManager = new TypedMessageManager();

    this._messageManagers = [
      this._messageManager,
      this._personalMessageManager,
      this._typedMessageManager,
    ];

    const methodNames = [
      methodNameSign,
      methodNamePersonalSign,
      methodNameTypedSign,
    ];

    this._messageManagers.forEach((messageManager, index) => {
      this._bubbleEvents(messageManager);

      messageManager.hub.on(
        'unapprovedMessage',
        (msgParams: AbstractMessageParamsMetamask) => {
          this._requestApproval(msgParams, methodNames[index]);
        },
      );
    });

    this._subscribeToMessageState(
      this._messageManager,
      (state, newMessages, messageCount) => {
        state.unapprovedMsgs = newMessages;
        state.unapprovedMsgCount = messageCount;
      },
    );

    this._subscribeToMessageState(
      this._personalMessageManager,
      (state, newMessages, messageCount) => {
        state.unapprovedPersonalMsgs = newMessages;
        state.unapprovedPersonalMsgCount = messageCount;
      },
    );

    this._subscribeToMessageState(
      this._typedMessageManager,
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
    this.update(() => getDefaultState());
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
    msgParams: MessageParams,
    req: OriginalRequest,
  ): Promise<string> {
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

    const data = this._normalizeMsgData(msgParams.data);

    // 64 hex + "0x" at the beginning
    // This is needed because Ethereum's EcSign works only on 32 byte numbers
    // For 67 length see: https://github.com/MetaMask/metamask-extension/pull/12679/files#r749479607
    if (data.length !== 66 && data.length !== 67) {
      throw ethErrors.rpc.invalidParams(
        'eth_sign requires 32 byte message hash',
      );
    }

    return this._messageManager.addUnapprovedMessageAsync(msgParams, req);
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
    msgParams: PersonalMessageParams,
    req: OriginalRequest,
  ): Promise<string> {
    return this._personalMessageManager.addUnapprovedMessageAsync(
      msgParams,
      req,
    );
  }

  /**
   * Called when a dapp uses the eth_signTypedData method, per EIP 712.
   *
   * @param msgParams - The params passed to eth_signTypedData.
   * @param req - The original request, containing the origin.
   * @param version
   */
  async newUnsignedTypedMessage(
    msgParams: TypedMessageParams,
    req: OriginalRequest,
    version: string,
  ): Promise<string> {
    return this._typedMessageManager.addUnapprovedMessageAsync(
      msgParams,
      version,
      req,
    );
  }

  /**
   * Signifies user intent to complete an eth_sign method.
   *
   * @param msgParams - The params passed to eth_call.
   * @returns Full state update.
   */
  async signMessage(msgParams: MessageParamsMetamask) {
    return await this._signAbstractMessage(
      this._messageManager,
      methodNameSign,
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
    return await this._signAbstractMessage(
      this._personalMessageManager,
      methodNamePersonalSign,
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

    return await this._signAbstractMessage(
      this._typedMessageManager,
      methodNameTypedSign,
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
   * @returns A full state update.
   */
  cancelMessage(msgId: string) {
    return this._cancelAbstractMessage(this._messageManager, msgId);
  }

  /**
   * Used to cancel a personal_sign type message.
   *
   * @param msgId - The ID of the message to cancel.
   * @returns A full state update.
   */
  cancelPersonalMessage(msgId: string) {
    return this._cancelAbstractMessage(this._personalMessageManager, msgId);
  }

  /**
   * Used to cancel a eth_signTypedData type message.
   *
   * @param msgId - The ID of the message to cancel.
   * @returns A full state update.
   */
  cancelTypedMessage(msgId: string) {
    return this._cancelAbstractMessage(this._typedMessageManager, msgId);
  }

  /**
   * Reject all unapproved messages of any type.
   *
   * @param reason - A message to indicate why.
   */
  rejectUnapproved(reason?: string) {
    this._messageManagers.forEach((messageManager) => {
      Object.keys(messageManager.getUnapprovedMessages()).forEach(
        (messageId) => {
          this._cancelAbstractMessage(messageManager, messageId, reason);
        },
      );
    });
  }

  /**
   * Clears all unapproved messages from memory.
   */
  clearUnapproved() {
    this._messageManagers.forEach((messageManager) => {
      messageManager.update({
        unapprovedMessages: {},
        unapprovedMessagesCount: 0,
      });
    });
  }

  private async _signAbstractMessage<P extends AbstractMessageParams>(
    messageManager: AbstractMessageManager<
      AbstractMessage,
      P,
      AbstractMessageParamsMetamask
    >,
    methodName: string,
    msgParams: AbstractMessageParamsMetamask,
    getSignature: (cleanMessageParams: P) => Promise<any>,
  ) {
    log.info(`MetaMaskController - ${methodName}`);

    const messageId = msgParams.metamaskId as string;

    try {
      const cleanMessageParams = await messageManager.approveMessage(msgParams);
      const signature = await getSignature(cleanMessageParams);

      messageManager.setMessageStatusSigned(messageId, signature);

      this._acceptApproval(messageId);

      return this._getState();
    } catch (error) {
      log.info(`MetaMaskController - ${methodName} failed.`, error);
      this._cancelAbstractMessage(messageManager, messageId);
      throw error;
    }
  }

  private _cancelAbstractMessage(
    messageManager: AbstractMessageManager<
      AbstractMessage,
      AbstractMessageParams,
      AbstractMessageParamsMetamask
    >,
    messageId: string,
    reason?: string,
  ) {
    if (reason) {
      const message = this._getMessage(messageId);

      this._metricsEvent({
        event: reason,
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          action: 'Sign Request',
          type: message.type,
        },
      });
    }

    messageManager.rejectMessage(messageId);
    this._rejectApproval(messageId);

    return this._getState();
  }

  private _bubbleEvents(
    messageManager: AbstractMessageManager<
      AbstractMessage,
      AbstractMessageParams,
      AbstractMessageParamsMetamask
    >,
  ) {
    messageManager.hub.on('updateBadge', () => {
      this.hub.emit('updateBadge');
    });
  }

  private _subscribeToMessageState(
    messageManager: AbstractMessageManager<
      AbstractMessage,
      AbstractMessageParams,
      AbstractMessageParamsMetamask
    >,
    updateState: (
      state: SignControllerState,
      newMessages: Record<string, StateMessage>,
      messageCount: number,
    ) => void,
  ) {
    messageManager.subscribe(
      async (state: MessageManagerState<AbstractMessage>) => {
        const newMessages = await this._migrateMessages(
          state.unapprovedMessages as any,
        );

        this.update((draftState) => {
          updateState(draftState, newMessages, state.unapprovedMessagesCount);
        });
      },
    );
  }

  private async _migrateMessages(
    coreMessages: Record<string, CoreMessage>,
  ): Promise<Record<string, StateMessage>> {
    const stateMessages: Record<string, StateMessage> = {};

    for (const messageId of Object.keys(coreMessages)) {
      const coreMessage = coreMessages[messageId];
      const stateMessage = await this._migrateMessage(coreMessage);

      stateMessages[messageId] = stateMessage;
    }

    return stateMessages;
  }

  private async _migrateMessage(
    coreMessage: CoreMessage,
  ): Promise<StateMessage> {
    const { messageParams, ...coreMessageData } = coreMessage;

    // Core message managers use messageParams but frontend uses msgParams with lots of references
    const stateMessage = {
      ...coreMessageData,
      rawSig: coreMessage.rawSig as string,
      msgParams: {
        ...messageParams,
        origin: messageParams.origin as string,
      },
    };

    const messageId = coreMessage.id;
    const existingMessage = this._getMessage(messageId);

    const securityProviderResponse = existingMessage
      ? existingMessage.securityProviderResponse
      : await this._securityProviderRequest(stateMessage, stateMessage.type);

    return { ...stateMessage, securityProviderResponse };
  }

  private _normalizeMsgData(data: string) {
    if (data.slice(0, 2) === '0x') {
      // data is already hex
      return data;
    }
    // data is unicode, convert to hex
    return bufferToHex(Buffer.from(data, 'utf8'));
  }

  private _getMessage(messageId: string): StateMessage {
    return {
      ...this.state.unapprovedMsgs,
      ...this.state.unapprovedPersonalMsgs,
      ...this.state.unapprovedTypedMessages,
    }[messageId];
  }

  private _requestApproval(
    msgParams: AbstractMessageParamsMetamask,
    type: string,
  ) {
    const id = msgParams.metamaskId as string;
    const origin = msgParams.origin || controllerName;

    this.messagingSystem
      .call(
        'ApprovalController:addRequest',
        {
          id,
          origin,
          type,
        },
        true,
      )
      .catch(() => {
        // Intentionally ignored as promise not currently used
      });
  }

  private _acceptApproval(messageId: string) {
    try {
      this.messagingSystem.call('ApprovalController:acceptRequest', messageId);
    } catch (error) {
      log.info('Failed to accept signature approval request', error);
    }
  }

  private _rejectApproval(messageId: string) {
    try {
      this.messagingSystem.call(
        'ApprovalController:rejectRequest',
        messageId,
        'Cancel',
      );
    } catch (error) {
      log.info('Failed to reject signature approval request', error);
    }
  }
}
