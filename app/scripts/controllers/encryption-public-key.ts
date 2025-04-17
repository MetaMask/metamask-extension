import log from 'loglevel';
import {
  EncryptionPublicKeyManager,
  EncryptionPublicKeyParamsMetamask,
  AbstractMessage,
  MessageManagerState,
  AbstractMessageParams,
  AbstractMessageParamsMetamask,
  OriginalRequest,
} from '@metamask/message-manager';
import type {
  EncryptionPublicKeyManagerMessenger,
  EncryptionPublicKeyManagerState,
  EncryptionPublicKeyManagerUnapprovedMessageAddedEvent,
} from '@metamask/message-manager';
import { BaseController, RestrictedMessenger } from '@metamask/base-controller';
import { Patch } from 'immer';
import {
  AcceptRequest,
  AddApprovalRequest,
  RejectRequest,
} from '@metamask/approval-controller';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { KeyringType } from '../../../shared/constants/keyring';
import { ORIGIN_METAMASK } from '../../../shared/constants/app';

const controllerName = 'EncryptionPublicKeyController';
const managerName = 'EncryptionPublicKeyManager';
const methodNameGetEncryptionPublicKey = 'eth_getEncryptionPublicKey';

const stateMetadata = {
  unapprovedEncryptionPublicKeyMsgs: { persist: false, anonymous: false },
  unapprovedEncryptionPublicKeyMsgCount: { persist: false, anonymous: false },
};

const getDefaultState = () => ({
  unapprovedEncryptionPublicKeyMsgs: {},
  unapprovedEncryptionPublicKeyMsgCount: 0,
});

export type CoreMessage = AbstractMessage & {
  messageParams: AbstractMessageParams;
};

export type StateMessage = Required<
  Omit<
    AbstractMessage,
    'securityAlertResponse' | 'securityProviderResponse' | 'metadata' | 'error'
  >
> & {
  msgParams: string;
};

export type EncryptionPublicKeyControllerState = {
  unapprovedEncryptionPublicKeyMsgs: Record<string, StateMessage>;
  unapprovedEncryptionPublicKeyMsgCount: number;
};

export type EncryptionPublicKeyControllerGetState = {
  type: `${typeof controllerName}:getState`;
  handler: () => EncryptionPublicKeyControllerState;
};

export type EncryptionPublicKeyControllerStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [EncryptionPublicKeyControllerState, Patch[]];
};

export type EncryptionPublicKeyControllerActions =
  EncryptionPublicKeyControllerGetState;

export type EncryptionPublicKeyControllerEvents =
  EncryptionPublicKeyControllerStateChange;

type EncryptionPublicKeyManagerStateChange = {
  type: `EncryptionPublicKeyManager:stateChange`;
  payload: [EncryptionPublicKeyManagerState, Patch[]];
};

type AllowedActions = AddApprovalRequest | AcceptRequest | RejectRequest;

type AllowedEvents =
  | EncryptionPublicKeyManagerStateChange
  | EncryptionPublicKeyManagerUnapprovedMessageAddedEvent;

export type EncryptionPublicKeyControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  EncryptionPublicKeyControllerActions | AllowedActions,
  EncryptionPublicKeyControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

export type EncryptionPublicKeyControllerOptions = {
  messenger: EncryptionPublicKeyControllerMessenger;
  getEncryptionPublicKey: (address: string) => Promise<string>;
  getAccountKeyringType: (account: string) => Promise<string>;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metricsEvent: (payload: any, options?: any) => void;
  managerMessenger: EncryptionPublicKeyManagerMessenger;
};

/**
 * Controller for requesting encryption public key requests requiring user approval.
 */
export default class EncryptionPublicKeyController extends BaseController<
  typeof controllerName,
  EncryptionPublicKeyControllerState,
  EncryptionPublicKeyControllerMessenger
> {
  private _getEncryptionPublicKey: (address: string) => Promise<string>;

  private _getAccountKeyringType: (account: string) => Promise<string>;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getState: () => any;

  private _encryptionPublicKeyManager: EncryptionPublicKeyManager;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _metricsEvent: (payload: any, options?: any) => void;

  /**
   * Construct a EncryptionPublicKey controller.
   *
   * @param options - The controller options.
   * @param options.messenger - The restricted controller messenger for the EncryptionPublicKey controller.
   * @param options.getEncryptionPublicKey - Callback to get the keyring encryption public key.
   * @param options.getAccountKeyringType - Callback to get the keyring type.
   * @param options.getState - Callback to retrieve all user state.
   * @param options.metricsEvent - A function for emitting a metric event.
   * @param options.managerMessenger
   */
  constructor({
    messenger,
    managerMessenger,
    getEncryptionPublicKey,
    getAccountKeyringType,
    getState,
    metricsEvent,
  }: EncryptionPublicKeyControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });

    this._getEncryptionPublicKey = getEncryptionPublicKey;
    this._getAccountKeyringType = getAccountKeyringType;
    this._getState = getState;
    this._metricsEvent = metricsEvent;
    this._encryptionPublicKeyManager = new EncryptionPublicKeyManager({
      additionalFinishStatuses: ['received'],
      messenger: managerMessenger,
    });

    this.messagingSystem.subscribe(
      `${managerName}:unapprovedMessage`,
      this._requestApproval.bind(this),
    );

    this._subscribeToMessageState(
      messenger,
      (state, newMessages, messageCount) => {
        state.unapprovedEncryptionPublicKeyMsgs = newMessages;
        state.unapprovedEncryptionPublicKeyMsgCount = messageCount;
      },
    );
  }

  /**
   * A getter for the number of 'unapproved' Messages in this.messages
   *
   * @returns The number of 'unapproved' Messages in this.messages
   */
  get unapprovedMsgCount(): number {
    return this._encryptionPublicKeyManager.getUnapprovedMessagesCount();
  }

  /**
   * Reset the controller state to the initial state.
   */
  resetState() {
    this.update(() => getDefaultState());
  }

  /**
   * Called when a Dapp uses the eth_getEncryptionPublicKey method, to request user approval.
   *
   * @param address - The address from the encryption public key will be extracted.
   * @param [req] - The original request, containing the origin.
   */
  async newRequestEncryptionPublicKey(
    address: string,
    req: OriginalRequest,
  ): Promise<string> {
    const keyringType = await this._getAccountKeyringType(address);

    switch (keyringType) {
      case KeyringType.ledger: {
        return new Promise((_, reject) => {
          reject(
            new Error('Ledger does not support eth_getEncryptionPublicKey.'),
          );
        });
      }

      case KeyringType.trezor: {
        return new Promise((_, reject) => {
          reject(
            new Error('Trezor does not support eth_getEncryptionPublicKey.'),
          );
        });
      }

      case KeyringType.lattice: {
        return new Promise((_, reject) => {
          reject(
            new Error('Lattice does not support eth_getEncryptionPublicKey.'),
          );
        });
      }

      case KeyringType.qr: {
        return Promise.reject(
          new Error('QR hardware does not support eth_getEncryptionPublicKey.'),
        );
      }

      default: {
        return this._encryptionPublicKeyManager.addUnapprovedMessageAsync(
          { from: address },
          req,
        );
      }
    }
  }

  /**
   * Signifies a user's approval to receiving encryption public key in queue.
   *
   * @param msgParams - The params of the message to receive & return to the Dapp.
   * @returns A full state update.
   */
  async encryptionPublicKey(msgParams: EncryptionPublicKeyParamsMetamask) {
    log.info('MetaMaskController - encryptionPublicKey');
    const messageId = msgParams.metamaskId as string;
    // sets the status op the message to 'approved'
    // and removes the metamaskId for decryption
    try {
      const cleanMessageParams =
        await this._encryptionPublicKeyManager.approveMessage(msgParams);

      // EncryptionPublicKey message
      const publicKey = await this._getEncryptionPublicKey(
        cleanMessageParams.from,
      );

      // tells the listener that the message has been processed
      // and can be returned to the dapp
      this._encryptionPublicKeyManager.setMessageStatusAndResult(
        messageId,
        publicKey,
        'received',
      );

      this._acceptApproval(messageId);

      return this._getState();
    } catch (error) {
      log.info(
        'MetaMaskController - eth_getEncryptionPublicKey failed.',
        error,
      );
      this._cancelAbstractMessage(this._encryptionPublicKeyManager, messageId);
      throw error;
    }
  }

  /**
   * Used to cancel a message submitted via eth_getEncryptionPublicKey.
   *
   * @param msgId - The id of the message to cancel.
   */
  cancelEncryptionPublicKey(msgId: string) {
    return this._cancelAbstractMessage(this._encryptionPublicKeyManager, msgId);
  }

  /**
   * Reject all unapproved messages of any type.
   *
   * @param reason - A message to indicate why.
   */
  rejectUnapproved(reason?: string) {
    Object.keys(
      this._encryptionPublicKeyManager.getUnapprovedMessages(),
    ).forEach((messageId) => {
      this._cancelAbstractMessage(
        this._encryptionPublicKeyManager,
        messageId,
        reason,
      );
    });
  }

  /**
   * Clears all unapproved messages from memory.
   */
  clearUnapproved() {
    this._encryptionPublicKeyManager.clearUnapprovedMessages();
  }

  private _cancelAbstractMessage(
    messageManager: EncryptionPublicKeyManager,
    messageId: string,
    reason?: string,
  ) {
    if (reason) {
      this._metricsEvent({
        event: reason,
        category: MetaMetricsEventCategory.Messages,
        properties: {
          action: 'Encryption public key Request',
        },
      });
    }

    messageManager.rejectMessage(messageId);
    this._rejectApproval(messageId);

    return this._getState();
  }

  private _subscribeToMessageState(
    controllerMessenger: EncryptionPublicKeyControllerMessenger,
    updateState: (
      state: EncryptionPublicKeyControllerState,
      newMessages: Record<string, StateMessage>,
      messageCount: number,
    ) => void,
  ) {
    controllerMessenger.subscribe(
      `${managerName}:stateChange`,
      (state: MessageManagerState<AbstractMessage>) => {
        const newMessages = this._migrateMessages(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          state.unapprovedMessages as any,
        );
        this.update((draftState) => {
          updateState(draftState, newMessages, state.unapprovedMessagesCount);
        });
      },
    );
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

    // Core message managers use messageParams but frontend uses msgParams with lots of references
    const stateMessage = {
      ...coreMessageData,
      rawSig: coreMessage.rawSig as string,
      msgParams: messageParams.from,
      origin: messageParams.origin,
    };

    return stateMessage;
  }

  private _requestApproval(msgParams: AbstractMessageParamsMetamask) {
    const id = msgParams.metamaskId as string;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const origin = msgParams.origin || ORIGIN_METAMASK;

    this.messagingSystem
      .call(
        'ApprovalController:addRequest',
        {
          id,
          origin,
          type: methodNameGetEncryptionPublicKey,
        },
        true,
      )
      .catch(() => {
        // Intentionally ignored as promise not currently used
      });
  }

  private _acceptApproval(messageId: string) {
    this.messagingSystem.call('ApprovalController:acceptRequest', messageId);
  }

  private _rejectApproval(messageId: string) {
    this.messagingSystem.call(
      'ApprovalController:rejectRequest',
      messageId,
      'Cancel',
    );
  }
}
