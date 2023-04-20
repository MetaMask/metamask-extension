/// <reference types="node" />
import EventEmitter from 'events';
import { MessageParams, MessageParamsMetamask, PersonalMessageParams, PersonalMessageParamsMetamask, TypedMessageParams, TypedMessageParamsMetamask, AbstractMessage, AbstractMessageParams, OriginalRequest } from '@metamask/message-manager';
import { BaseControllerV2, RestrictedControllerMessenger } from '@metamask/base-controller';
import { Patch } from 'immer';
import { AcceptRequest, AddApprovalRequest, RejectRequest } from '@metamask/approval-controller';
declare const controllerName = "SignatureController";
declare type StateMessage = Required<AbstractMessage> & {
    msgParams: Required<AbstractMessageParams>;
};
declare type SignatureControllerState = {
    unapprovedMsgs: Record<string, StateMessage>;
    unapprovedPersonalMsgs: Record<string, StateMessage>;
    unapprovedTypedMessages: Record<string, StateMessage>;
    unapprovedMsgCount: number;
    unapprovedPersonalMsgCount: number;
    unapprovedTypedMessagesCount: number;
};
declare type AllowedActions = AddApprovalRequest | AcceptRequest | RejectRequest;
export declare type GetSignatureState = {
    type: `${typeof controllerName}:getState`;
    handler: () => SignatureControllerState;
};
export declare type SignatureStateChange = {
    type: `${typeof controllerName}:stateChange`;
    payload: [SignatureControllerState, Patch[]];
};
export declare type SignatureControllerActions = GetSignatureState;
export declare type SignatureControllerEvents = SignatureStateChange;
export declare type SignatureControllerMessenger = RestrictedControllerMessenger<typeof controllerName, SignatureControllerActions | AllowedActions, SignatureControllerEvents, AllowedActions['type'], never>;
export interface KeyringController {
    signMessage: (messsageParams: MessageParams) => Promise<string>;
    signPersonalMessage: (messsageParams: PersonalMessageParams) => Promise<string>;
    signTypedMessage: (messsageParams: TypedMessageParams, options: {
        version: string | undefined;
    }) => Promise<string>;
}
export declare type SignatureControllerOptions = {
    messenger: SignatureControllerMessenger;
    keyringController: KeyringController;
    isEthSignEnabled: () => boolean;
    getState: () => any;
    securityProviderRequest?: (requestData: any, methodName: string) => Promise<any>;
};
/**
 * Controller for creating signing requests requiring user approval.
 */
export declare class SignatureController extends BaseControllerV2<typeof controllerName, SignatureControllerState, SignatureControllerMessenger> {
    hub: EventEmitter;
    private _keyringController;
    private _isEthSignEnabled;
    private _getState;
    private _messageManager;
    private _personalMessageManager;
    private _typedMessageManager;
    /**
     * Construct a Sign controller.
     *
     * @param options - The controller options.
     * @param options.messenger - The restricted controller messenger for the sign controller.
     * @param options.keyringController - An instance of a keyring controller used to perform the signing operations.
     * @param options.isEthSignEnabled - Callback to return true if eth_sign is enabled.
     * @param options.getState - Callback to retrieve all user state.
     * @param options.securityProviderRequest - A function for verifying a message, whether it is malicious or not.
     */
    constructor({ messenger, keyringController, isEthSignEnabled, getState, securityProviderRequest, }: SignatureControllerOptions);
    /**
     * A getter for the number of 'unapproved' Messages in this.messages.
     *
     * @returns The number of 'unapproved' Messages in this.messages
     */
    get unapprovedMsgCount(): number;
    /**
     * A getter for the number of 'unapproved' PersonalMessages in this.messages.
     *
     * @returns The number of 'unapproved' PersonalMessages in this.messages
     */
    get unapprovedPersonalMessagesCount(): number;
    /**
     * A getter for the number of 'unapproved' TypedMessages in this.messages.
     *
     * @returns The number of 'unapproved' TypedMessages in this.messages
     */
    get unapprovedTypedMessagesCount(): number;
    /**
     * Reset the controller state to the initial state.
     */
    resetState(): void;
    /**
     * Called when a Dapp uses the eth_sign method, to request user approval.
     * eth_sign is a pure signature of arbitrary data. It is on a deprecation
     * path, since this data can be a transaction, or can leak private key
     * information.
     *
     * @param msgParams - The params passed to eth_sign.
     * @param [req] - The original request, containing the origin.
     * @returns Promise resolving to the raw data of the signature request.
     */
    newUnsignedMessage(msgParams: MessageParams, req: OriginalRequest): Promise<string>;
    /**
     * Called when a dapp uses the personal_sign method.
     * This is identical to the Geth eth_sign method, and may eventually replace
     * eth_sign.
     *
     * We currently define our eth_sign and personal_sign mostly for legacy Dapps.
     *
     * @param msgParams - The params of the message to sign & return to the Dapp.
     * @param req - The original request, containing the origin.
     * @returns Promise resolving to the raw data of the signature request.
     */
    newUnsignedPersonalMessage(msgParams: PersonalMessageParams, req: OriginalRequest): Promise<string>;
    /**
     * Called when a dapp uses the eth_signTypedData method, per EIP 712.
     *
     * @param msgParams - The params passed to eth_signTypedData.
     * @param req - The original request, containing the origin.
     * @param version - The version indicating the format of the typed data.
     * @returns Promise resolving to the raw data of the signature request.
     */
    newUnsignedTypedMessage(msgParams: TypedMessageParams, req: OriginalRequest, version: string): Promise<string>;
    /**
     * Signifies user intent to complete an eth_sign method.
     *
     * @param msgParams - The params passed to eth_call.
     * @returns Full state update.
     */
    signMessage(msgParams: MessageParamsMetamask): Promise<any>;
    /**
     * Signifies a user's approval to sign a personal_sign message in queue.
     * Triggers signing, and the callback function from newUnsignedPersonalMessage.
     *
     * @param msgParams - The params of the message to sign & return to the Dapp.
     * @returns A full state update.
     */
    signPersonalMessage(msgParams: PersonalMessageParamsMetamask): Promise<any>;
    /**
     * The method for a user approving a call to eth_signTypedData, per EIP 712.
     * Triggers the callback in newUnsignedTypedMessage.
     *
     * @param msgParams - The params passed to eth_signTypedData.
     * @param opts - Options bag.
     * @param opts.parseJsonData - Whether to parse JSON data before calling the KeyringController.
     * @returns Full state update.
     */
    signTypedMessage(msgParams: TypedMessageParamsMetamask, opts?: {
        parseJsonData: boolean;
    }): Promise<any>;
    /**
     * Used to cancel a message submitted via eth_sign.
     *
     * @param msgId - The id of the message to cancel.
     * @returns A full state update.
     */
    cancelMessage(msgId: string): any;
    /**
     * Used to cancel a personal_sign type message.
     *
     * @param msgId - The ID of the message to cancel.
     * @returns A full state update.
     */
    cancelPersonalMessage(msgId: string): any;
    /**
     * Used to cancel a eth_signTypedData type message.
     *
     * @param msgId - The ID of the message to cancel.
     * @returns A full state update.
     */
    cancelTypedMessage(msgId: string): any;
    /**
     * Reject all unapproved messages of any type.
     *
     * @param reason - A message to indicate why.
     */
    rejectUnapproved(reason?: string): void;
    /**
     * Clears all unapproved messages from memory.
     */
    clearUnapproved(): void;
    private _rejectUnapproved;
    private _clearUnapproved;
    private _signAbstractMessage;
    private _errorMessage;
    private _cancelAbstractMessage;
    private _handleMessageManagerEvents;
    private _subscribeToMessageState;
    private _migrateMessages;
    private _migrateMessage;
    private _normalizeMsgData;
    private _getMessage;
    private _requestApproval;
    private _acceptApproval;
    private _rejectApproval;
    private _removeJsonData;
}
export {};
//# sourceMappingURL=SignatureController.d.ts.map