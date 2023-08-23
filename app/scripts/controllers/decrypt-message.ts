import EventEmitter from 'events';
import log from 'loglevel';
import {
  DecryptMessageManager,
  DecryptMessageParams,
  DecryptMessageParamsMetamask,
} from '@metamask/message-manager';
import { KeyringController } from '@metamask/eth-keyring-controller';
import {
  AbstractMessage,
  AbstractMessageManager,
  AbstractMessageParams,
  AbstractMessageParamsMetamask,
  MessageManagerState,
  OriginalRequest,
} from '@metamask/message-manager/dist/AbstractMessageManager';
import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  AcceptRequest,
  AddApprovalRequest,
  RejectRequest,
} from '@metamask/approval-controller';
import { ApprovalType, ORIGIN_METAMASK } from '@metamask/controller-utils';
import { Patch } from 'immer';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';

const controllerName = 'DecryptMessageController';

const stateMetadata = {
  unapprovedDecryptMsgs: { persist: false, anonymous: false },
  unapprovedDecryptMsgCount: { persist: false, anonymous: false },
};

export const getDefaultState = () => ({
  unapprovedDecryptMsgs: {},
  unapprovedDecryptMsgCount: 0,
});

export type CoreMessage = AbstractMessage & {
  messageParams: AbstractMessageParams;
};

export type StateMessage = Required<
  Omit<
    AbstractMessage,
    'securityAlertResponse' | 'securityProviderResponse' | 'metadata' | 'error'
  >
>;

export type DecryptMessageControllerState = {
  unapprovedDecryptMsgs: Record<string, StateMessage>;
  unapprovedDecryptMsgCount: number;
};

export type GetDecryptMessageState = {
  type: `${typeof controllerName}:getState`;
  handler: () => DecryptMessageControllerState;
};

export type DecryptMessageStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [DecryptMessageControllerState, Patch[]];
};

export type DecryptMessageControllerActions = GetDecryptMessageState;

export type DecryptMessageControllerEvents = DecryptMessageStateChange;

type AllowedActions = AddApprovalRequest | AcceptRequest | RejectRequest;

export type DecryptMessageControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  DecryptMessageControllerActions | AllowedActions,
  DecryptMessageControllerEvents,
  AllowedActions['type'],
  never
>;

export type DecryptMessageControllerOptions = {
  getState: () => any;
  keyringController: KeyringController;
  messenger: DecryptMessageControllerMessenger;
  metricsEvent: (payload: any, options?: any) => void;
};

/**
 * Controller for decrypt signing requests requiring user approval.
 */
export default class DecryptMessageController extends BaseControllerV2<
  typeof controllerName,
  DecryptMessageControllerState,
  DecryptMessageControllerMessenger
> {
  hub: EventEmitter;

  private _getState: () => any;

  private _keyringController: KeyringController;

  private _metricsEvent: (payload: any, options?: any) => void;

  private _decryptMessageManager: DecryptMessageManager;

  /**
   * Construct a DecryptMessage controller.
   *
   * @param options - The controller options.
   * @param options.getState - Callback to retrieve all user state.
   * @param options.keyringController - An instance of a keyring controller used to decrypt message
   * @param options.messenger - A reference to the messaging system.
   * @param options.metricsEvent - A function for emitting a metric event.
   */
  constructor({
    getState,
    keyringController,
    metricsEvent,
    messenger,
  }: DecryptMessageControllerOptions) {
    super({
      metadata: stateMetadata,
      messenger,
      name: controllerName,
      state: getDefaultState(),
    });
    this._getState = getState;
    this._keyringController = keyringController;
    this._metricsEvent = metricsEvent;

    this.hub = new EventEmitter();

    this._decryptMessageManager = new DecryptMessageManager(
      undefined,
      undefined,
      undefined,
      ['decrypted'],
    );

    this._decryptMessageManager.hub.on('updateBadge', () => {
      this.hub.emit('updateBadge');
    });

    this._decryptMessageManager.hub.on(
      'unapprovedMessage',
      (messageParams: AbstractMessageParamsMetamask) => {
        this._requestApproval(messageParams);
      },
    );

    this._subscribeToMessageState(
      this._decryptMessageManager,
      (state, newMessages, messageCount) => {
        state.unapprovedDecryptMsgs = newMessages;
        state.unapprovedDecryptMsgCount = messageCount;
      },
    );
  }

  /**
   * A getter for the number of 'unapproved' Messages in the DecryptMessageManager.
   *
   * @returns The number of 'unapproved' Messages in the DecryptMessageManager.
   */
  get unapprovedDecryptMsgCount(): number {
    return this._decryptMessageManager.getUnapprovedMessagesCount();
  }

  /**
   * Reset the controller state to the initial state.
   */
  resetState() {
    this.update(() => getDefaultState());
  }

  /**
   * Clears all unapproved messages from memory.
   */
  clearUnapproved() {
    this._decryptMessageManager.update({
      unapprovedMessages: {},
      unapprovedMessagesCount: 0,
    });
  }

  /**
   * Called when a dapp uses the eth_decrypt method
   *
   * @param messageParams - The params passed to eth_decrypt.
   * @param req - The original request, containing the origin.
   * @returns Promise resolving to the raw data of the signature request.
   */
  async newRequestDecryptMessage(
    messageParams: DecryptMessageParams,
    req: OriginalRequest,
  ): Promise<string> {
    return this._decryptMessageManager.addUnapprovedMessageAsync(
      messageParams,
      req,
    );
  }

  /**
   * Signifies a user's approval to decrypt a message in queue.
   * Triggers decrypt, and the callback function from newUnsignedDecryptMessage.
   *
   * @param messageParams - The params of the message to decrypt & return to the Dapp.
   * @returns A full state update.
   */
  async decryptMessage(messageParams: DecryptMessageParamsMetamask) {
    const messageId = messageParams.metamaskId as string;
    try {
      const cleanMessageParams =
        await this._decryptMessageManager.approveMessage(messageParams);

      cleanMessageParams.data = this._parseMessageData(cleanMessageParams.data);
      const rawMessage = await this._keyringController.decryptMessage(
        cleanMessageParams,
      );

      this._decryptMessageManager.setMessageStatusAndResult(
        messageId,
        rawMessage,
        'decrypted',
      );
      this._acceptApproval(messageId);
    } catch (error) {
      log.info('MetaMaskController - eth_decrypt failed.', error);
      this._cancelAbstractMessage(this._decryptMessageManager, messageId);
      throw error;
    }
    return this._getState();
  }

  /**
   * Only decrypt message and don't touch transaction state
   *
   * @param messageParams - The params of the message to decrypt.
   * @returns A full state update.
   */
  async decryptMessageInline(messageParams: DecryptMessageParamsMetamask) {
    const messageId = messageParams.metamaskId as string;
    messageParams.data = this._parseMessageData(messageParams.data);
    const rawMessage = await this._keyringController.decryptMessage(
      messageParams,
    );

    this._decryptMessageManager.setResult(messageId, rawMessage);

    return this._getState();
  }

  /**
   * Used to cancel a eth_decrypt type message.
   *
   * @param messageId - The ID of the message to cancel.
   * @returns A full state update.
   */
  cancelDecryptMessage(messageId: string) {
    this._decryptMessageManager.rejectMessage(messageId);
    this._rejectApproval(messageId);
    return this._getState();
  }

  /**
   * Reject all unapproved messages of any type.
   *
   * @param reason - A message to indicate why.
   */
  rejectUnapproved(reason?: string) {
    Object.keys(this._decryptMessageManager.getUnapprovedMessages()).forEach(
      (messageId) => {
        this._cancelAbstractMessage(
          this._decryptMessageManager,
          messageId,
          reason,
        );
      },
    );
  }

  private _acceptApproval(messageId: string) {
    this.messagingSystem.call('ApprovalController:acceptRequest', messageId);
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
      this._metricsEvent({
        event: reason,
        category: MetaMetricsEventCategory.Messages,
        properties: {
          action: 'Decrypt Message Request',
        },
      });
    }

    messageManager.rejectMessage(messageId);
    this._rejectApproval(messageId);

    return this._getState();
  }

  private _subscribeToMessageState(
    messageManager: AbstractMessageManager<
      AbstractMessage,
      AbstractMessageParams,
      AbstractMessageParamsMetamask
    >,
    updateState: (
      state: DecryptMessageControllerState,
      newMessages: Record<string, StateMessage>,
      messageCount: number,
    ) => void,
  ) {
    messageManager.subscribe((state: MessageManagerState<AbstractMessage>) => {
      const newMessages = this._migrateMessages(
        state.unapprovedMessages as any,
      );
      this.update((draftState) => {
        updateState(draftState, newMessages, state.unapprovedMessagesCount);
      });
    });
  }

  private _migrateMessages(
    coreMessages: Record<string, CoreMessage>,
  ): Record<string, StateMessage> {
    const stateMessages: Record<string, StateMessage> = {};

    for (const messageId of Object.keys(coreMessages)) {
      const coreMessage = coreMessages[messageId];
      const stateMessage = this._migrateMessage(coreMessage);
      stateMessages[messageId] = stateMessage;
    }

    return stateMessages;
  }

  private _migrateMessage(coreMessage: CoreMessage): StateMessage {
    const { messageParams, ...coreMessageData } = coreMessage;

    const stateMessage = {
      ...coreMessageData,
      rawSig: coreMessage.rawSig as string,
      msgParams: messageParams,
      origin: messageParams.origin,
    };

    return stateMessage;
  }

  private _requestApproval(messageParams: AbstractMessageParamsMetamask) {
    const id = messageParams.metamaskId as string;
    const origin = messageParams.origin || ORIGIN_METAMASK;
    try {
      this.messagingSystem.call(
        'ApprovalController:addRequest',
        {
          id,
          origin,
          type: ApprovalType.EthDecrypt,
        },
        true,
      );
    } catch (error) {
      log.info('Error adding request to approval controller', error);
    }
  }

  private _parseMessageData(data: string) {
    const stripped = stripHexPrefix(data);
    const buff = Buffer.from(stripped, 'hex');
    return JSON.parse(buff.toString('utf8'));
  }

  private _rejectApproval(messageId: string) {
    try {
      this.messagingSystem.call(
        'ApprovalController:rejectRequest',
        messageId,
        'Cancel',
      );
    } catch (error) {
      log.info('Error rejecting request to approval controller', error);
    }
  }
}
