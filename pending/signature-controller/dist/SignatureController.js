"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureController = void 0;
const events_1 = __importDefault(require("events"));
const message_manager_1 = require("@metamask/message-manager");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_controller_1 = require("@metamask/base-controller");
const controller_utils_1 = require("@metamask/controller-utils");
const controllerName = 'SignatureController';
const methodNameSign = 'eth_sign';
const methodNamePersonalSign = 'personal_sign';
const methodNameTypedSign = 'eth_signTypedData';
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
/**
 * Controller for creating signing requests requiring user approval.
 */
class SignatureController extends base_controller_1.BaseControllerV2 {
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
    constructor({ messenger, keyringController, isEthSignEnabled, getState, securityProviderRequest, }) {
        super({
            name: controllerName,
            metadata: stateMetadata,
            messenger,
            state: getDefaultState(),
        });
        this._keyringController = keyringController;
        this._isEthSignEnabled = isEthSignEnabled;
        this._getState = getState;
        this._securityProviderRequest = securityProviderRequest;
        this.hub = new events_1.default();
        this._messageManager = new message_manager_1.MessageManager();
        this._personalMessageManager = new message_manager_1.PersonalMessageManager();
        this._typedMessageManager = new message_manager_1.TypedMessageManager();
        this._handleMessageManagerEvents(this._messageManager, methodNameSign, 'unapprovedMessage');
        this._handleMessageManagerEvents(this._personalMessageManager, methodNamePersonalSign, 'unapprovedPersonalMessage');
        this._handleMessageManagerEvents(this._typedMessageManager, methodNameTypedSign, 'unapprovedTypedMessage');
        this._subscribeToMessageState(this._messageManager, (state, newMessages, messageCount) => {
            state.unapprovedMsgs = newMessages;
            state.unapprovedMsgCount = messageCount;
        });
        this._subscribeToMessageState(this._personalMessageManager, (state, newMessages, messageCount) => {
            state.unapprovedPersonalMsgs = newMessages;
            state.unapprovedPersonalMsgCount = messageCount;
        });
        this._subscribeToMessageState(this._typedMessageManager, (state, newMessages, messageCount) => {
            state.unapprovedTypedMessages = newMessages;
            state.unapprovedTypedMessagesCount = messageCount;
        });
    }
    /**
     * A getter for the number of 'unapproved' Messages in this.messages.
     *
     * @returns The number of 'unapproved' Messages in this.messages
     */
    get unapprovedMsgCount() {
        return this._messageManager.getUnapprovedMessagesCount();
    }
    /**
     * A getter for the number of 'unapproved' PersonalMessages in this.messages.
     *
     * @returns The number of 'unapproved' PersonalMessages in this.messages
     */
    get unapprovedPersonalMessagesCount() {
        return this._personalMessageManager.getUnapprovedMessagesCount();
    }
    /**
     * A getter for the number of 'unapproved' TypedMessages in this.messages.
     *
     * @returns The number of 'unapproved' TypedMessages in this.messages
     */
    get unapprovedTypedMessagesCount() {
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
     * @returns Promise resolving to the raw data of the signature request.
     */
    newUnsignedMessage(msgParams, req) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line camelcase
            if (!this._isEthSignEnabled()) {
                throw eth_rpc_errors_1.ethErrors.rpc.methodNotFound('eth_sign has been disabled. You must enable it in the advanced settings');
            }
            const data = this._normalizeMsgData(msgParams.data);
            // 64 hex + "0x" at the beginning
            // This is needed because Ethereum's EcSign works only on 32 byte numbers
            // For 67 length see: https://github.com/MetaMask/metamask-extension/pull/12679/files#r749479607
            if (data.length !== 66 && data.length !== 67) {
                throw eth_rpc_errors_1.ethErrors.rpc.invalidParams('eth_sign requires 32 byte message hash');
            }
            return this._messageManager.addUnapprovedMessageAsync(msgParams, req);
        });
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
     * @returns Promise resolving to the raw data of the signature request.
     */
    newUnsignedPersonalMessage(msgParams, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._personalMessageManager.addUnapprovedMessageAsync(msgParams, req);
        });
    }
    /**
     * Called when a dapp uses the eth_signTypedData method, per EIP 712.
     *
     * @param msgParams - The params passed to eth_signTypedData.
     * @param req - The original request, containing the origin.
     * @param version - The version indicating the format of the typed data.
     * @returns Promise resolving to the raw data of the signature request.
     */
    newUnsignedTypedMessage(msgParams, req, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._typedMessageManager.addUnapprovedMessageAsync(msgParams, version, req);
        });
    }
    /**
     * Signifies user intent to complete an eth_sign method.
     *
     * @param msgParams - The params passed to eth_call.
     * @returns Full state update.
     */
    signMessage(msgParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._signAbstractMessage(this._messageManager, methodNameSign, msgParams, (cleanMsgParams) => __awaiter(this, void 0, void 0, function* () { return yield this._keyringController.signMessage(cleanMsgParams); }));
        });
    }
    /**
     * Signifies a user's approval to sign a personal_sign message in queue.
     * Triggers signing, and the callback function from newUnsignedPersonalMessage.
     *
     * @param msgParams - The params of the message to sign & return to the Dapp.
     * @returns A full state update.
     */
    signPersonalMessage(msgParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._signAbstractMessage(this._personalMessageManager, methodNamePersonalSign, msgParams, (cleanMsgParams) => __awaiter(this, void 0, void 0, function* () { return yield this._keyringController.signPersonalMessage(cleanMsgParams); }));
        });
    }
    /**
     * The method for a user approving a call to eth_signTypedData, per EIP 712.
     * Triggers the callback in newUnsignedTypedMessage.
     *
     * @param msgParams - The params passed to eth_signTypedData.
     * @param opts - Options bag.
     * @param opts.parseJsonData - Whether to parse JSON data before calling the KeyringController.
     * @returns Full state update.
     */
    signTypedMessage(msgParams, opts = { parseJsonData: true }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { version } = msgParams;
            return yield this._signAbstractMessage(this._typedMessageManager, methodNameTypedSign, msgParams, (cleanMsgParams) => __awaiter(this, void 0, void 0, function* () {
                const finalMessageParams = opts.parseJsonData
                    ? this._removeJsonData(cleanMsgParams, version)
                    : cleanMsgParams;
                return yield this._keyringController.signTypedMessage(finalMessageParams, {
                    version,
                });
            }));
        });
    }
    /**
     * Used to cancel a message submitted via eth_sign.
     *
     * @param msgId - The id of the message to cancel.
     * @returns A full state update.
     */
    cancelMessage(msgId) {
        return this._cancelAbstractMessage(this._messageManager, msgId);
    }
    /**
     * Used to cancel a personal_sign type message.
     *
     * @param msgId - The ID of the message to cancel.
     * @returns A full state update.
     */
    cancelPersonalMessage(msgId) {
        return this._cancelAbstractMessage(this._personalMessageManager, msgId);
    }
    /**
     * Used to cancel a eth_signTypedData type message.
     *
     * @param msgId - The ID of the message to cancel.
     * @returns A full state update.
     */
    cancelTypedMessage(msgId) {
        return this._cancelAbstractMessage(this._typedMessageManager, msgId);
    }
    /**
     * Reject all unapproved messages of any type.
     *
     * @param reason - A message to indicate why.
     */
    rejectUnapproved(reason) {
        this._rejectUnapproved(this._messageManager, reason);
        this._rejectUnapproved(this._personalMessageManager, reason);
        this._rejectUnapproved(this._typedMessageManager, reason);
    }
    /**
     * Clears all unapproved messages from memory.
     */
    clearUnapproved() {
        this._clearUnapproved(this._messageManager);
        this._clearUnapproved(this._personalMessageManager);
        this._clearUnapproved(this._typedMessageManager);
    }
    _rejectUnapproved(messageManager, reason) {
        Object.keys(messageManager.getUnapprovedMessages()).forEach((messageId) => {
            this._cancelAbstractMessage(messageManager, messageId, reason);
        });
    }
    _clearUnapproved(messageManager) {
        messageManager.update({
            unapprovedMessages: {},
            unapprovedMessagesCount: 0,
        });
    }
    _signAbstractMessage(messageManager, methodName, msgParams, getSignature) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info(`MetaMaskController - ${methodName}`);
            const messageId = msgParams.metamaskId;
            try {
                const cleanMessageParams = yield messageManager.approveMessage(msgParams);
                const signature = yield getSignature(cleanMessageParams);
                messageManager.setMessageStatusSigned(messageId, signature);
                this._acceptApproval(messageId);
                return this._getState();
            }
            catch (error) {
                console.info(`MetaMaskController - ${methodName} failed.`, error);
                this._errorMessage(messageManager, messageId, error.message);
                throw error;
            }
        });
    }
    _errorMessage(messageManager, messageId, error) {
        if (messageManager instanceof message_manager_1.TypedMessageManager) {
            messageManager.setMessageStatusErrored(messageId, error);
            this._rejectApproval(messageId);
        }
        else {
            this._cancelAbstractMessage(messageManager, messageId);
        }
    }
    _cancelAbstractMessage(messageManager, messageId, reason) {
        if (reason) {
            const message = this._getMessage(messageId);
            this.hub.emit('cancelWithReason', { message, reason });
        }
        messageManager.rejectMessage(messageId);
        this._rejectApproval(messageId);
        return this._getState();
    }
    _handleMessageManagerEvents(messageManager, methodName, eventName) {
        messageManager.hub.on('updateBadge', () => {
            this.hub.emit('updateBadge');
        });
        messageManager.hub.on('unapprovedMessage', (msgParams) => {
            this.hub.emit(eventName, msgParams);
            this._requestApproval(msgParams, methodName);
        });
    }
    _subscribeToMessageState(messageManager, updateState) {
        messageManager.subscribe((state) => {
            const newMessages = this._migrateMessages(state.unapprovedMessages);
            this.update((draftState) => {
                updateState(draftState, newMessages, state.unapprovedMessagesCount);
            });
        });
    }
    _migrateMessages(coreMessages) {
        const stateMessages = {};
        for (const messageId of Object.keys(coreMessages)) {
            const coreMessage = coreMessages[messageId];
            const stateMessage = this._migrateMessage(coreMessage);
            stateMessages[messageId] = stateMessage;
        }
        return stateMessages;
    }
    _migrateMessage(coreMessage) {
        const { messageParams } = coreMessage, coreMessageData = __rest(coreMessage, ["messageParams"]);
        // Core message managers use messageParams but frontend uses msgParams with lots of references
        const stateMessage = Object.assign(Object.assign({}, coreMessageData), { msgParams: messageParams });
        return stateMessage;
    }
    _normalizeMsgData(data) {
        if (data.slice(0, 2) === '0x') {
            // data is already hex
            return data;
        }
        // data is unicode, convert to hex
        return (0, ethereumjs_util_1.bufferToHex)(Buffer.from(data, 'utf8'));
    }
    _getMessage(messageId) {
        return Object.assign(Object.assign(Object.assign({}, this.state.unapprovedMsgs), this.state.unapprovedPersonalMsgs), this.state.unapprovedTypedMessages)[messageId];
    }
    _requestApproval(msgParams, type) {
        var _a;
        const id = msgParams.metamaskId;
        const origin = (_a = msgParams.origin) !== null && _a !== void 0 ? _a : controller_utils_1.ORIGIN_METAMASK;
        this.messagingSystem
            .call('ApprovalController:addRequest', {
            id,
            origin,
            type,
        }, true)
            .catch(() => {
            // Intentionally ignored as promise not currently used
        });
    }
    _acceptApproval(messageId) {
        this.messagingSystem.call('ApprovalController:acceptRequest', messageId);
    }
    _rejectApproval(messageId) {
        this.messagingSystem.call('ApprovalController:rejectRequest', messageId, 'Cancel');
    }
    _removeJsonData(messageParams, version) {
        if (version === 'V1' || typeof messageParams.data !== 'string') {
            return messageParams;
        }
        return Object.assign(Object.assign({}, messageParams), { data: JSON.parse(messageParams.data) });
    }
}
exports.SignatureController = SignatureController;
//# sourceMappingURL=SignatureController.js.map