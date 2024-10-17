import EventEmitter from 'events';
import log from 'loglevel';
import {
  AbstractMessage,
  AbstractMessageManager,
  AbstractMessageParams,
  AbstractMessageParamsMetamask,
  MessageManagerState,
  OriginalRequest,
  DecryptMessageManager,
  DecryptMessageParams,
  DecryptMessageParamsMetamask,
} from '@metamask/message-manager';
import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  AcceptRequest,
  AddApprovalRequest,
  RejectRequest,
} from '@metamask/approval-controller';
import { ApprovalType, ORIGIN_METAMASK } from '@metamask/controller-utils';
import { Patch } from 'immer';
import type { KeyringControllerDecryptMessageAction } from '@metamask/keyring-controller';
import { Eip1024EncryptedData, hasProperty, isObject } from '@metamask/utils';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';

const controllerName = 'DecryptMessageController';

const stateMetadata = {
  unapprovedDecryptMsgs: { persist: false, anonymous: false },
  unapprovedDecryptMsgCount: { persist: false, anonymous: false },
};

/**
 * Type guard that checks for the presence of the required properties
 * for EIP-1024 encrypted data.
 *
 * See: https://eips.ethereum.org/EIPS/eip-1024
 *
 * @param message - The message to check.
 * @param message.from - The sender of the message.
 * @param message.data - The EIP-1024 encrypted data.
 * @returns Whether the message is an EIP-1024 encrypted message.
 */
export const isEIP1024EncryptedMessage = (message: {
  from: string;
  data: unknown;
}): message is {
  from: string;
  data: Eip1024EncryptedData;
} => {
  if (
    isObject(message.data) &&
    hasProperty(message.data, 'version') &&
    hasProperty(message.data, 'nonce') &&
    hasProperty(message.data, 'ephemPublicKey') &&
    hasProperty(message.data, 'ciphertext')
  ) {
    return true;
  }

  return false;
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

type AllowedActions =
  | AddApprovalRequest
  | AcceptRequest
  | RejectRequest
  | KeyringControllerDecryptMessageAction;

export type DecryptMessageControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  DecryptMessageControllerActions | AllowedActions,
  DecryptMessageControllerEvents,
  AllowedActions['type'],
  never
>;

export type DecryptMessageControllerOptions = {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any;
  messenger: DecryptMessageControllerMessenger;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metricsEvent: (payload: any, options?: any) => void;
};

/**
 * Controller for decrypt signing requests requiring user approval.
 */
export default class DecryptMessageController extends BaseController<
  typeof controllerName,
  DecryptMessageControllerState,
  DecryptMessageControllerMessenger
> {
  hub: EventEmitter;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getState: () => any;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _metricsEvent: (payload: any, options?: any) => void;

  private _decryptMessageManager: DecryptMessageManager;

  /**
   * Construct a DecryptMessage controller.
   *
   * @param options - The controller options.
   * @param options.getState - Callback to retrieve all user state.
   * @param options.messenger - A reference to the messaging system.
   * @param options.metricsEvent - A function for emitting a metric event.
   */
  constructor({
    getState,
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
      if (!isEIP1024EncryptedMessage(cleanMessageParams)) {
        throw new Error('Invalid encrypted data.');
      }

      const rawMessage = await this.messagingSystem.call(
        'KeyringController:decryptMessage',
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
    if (!isEIP1024EncryptedMessage(messageParams)) {
      throw new Error('Invalid encrypted data.');
    }
    const rawMessage = await this.messagingSystem.call(
      'KeyringController:decryptMessage',
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
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
