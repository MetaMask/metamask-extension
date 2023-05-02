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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
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
var _SignatureController_instances, _SignatureController_keyringController, _SignatureController_isEthSignEnabled, _SignatureController_getAllState, _SignatureController_messageManager, _SignatureController_personalMessageManager, _SignatureController_typedMessageManager, _SignatureController_rejectUnapproved, _SignatureController_clearUnapproved, _SignatureController_signAbstractMessage, _SignatureController_errorMessage, _SignatureController_cancelAbstractMessage, _SignatureController_handleMessageManagerEvents, _SignatureController_subscribeToMessageState, _SignatureController_migrateMessages, _SignatureController_migrateMessage, _SignatureController_normalizeMsgData, _SignatureController_getMessage, _SignatureController_requestApproval, _SignatureController_acceptApproval, _SignatureController_rejectApproval, _SignatureController_removeJsonData;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureController = void 0;
const events_1 = __importDefault(require("events"));
const message_manager_1 = require("@metamask/message-manager");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const ethereumjs_util_1 = require("ethereumjs-util");
const base_controller_1 = require("@metamask/base-controller");
const controller_utils_1 = require("@metamask/controller-utils");
const controllerName = 'SignatureController';
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
     * @param options.getAllState - Callback to retrieve all user state.
     * @param options.securityProviderRequest - A function for verifying a message, whether it is malicious or not.
     */
    constructor({ messenger, keyringController, isEthSignEnabled, getAllState, securityProviderRequest, }) {
        super({
            name: controllerName,
            metadata: stateMetadata,
            messenger,
            state: getDefaultState(),
        });
        _SignatureController_instances.add(this);
        _SignatureController_keyringController.set(this, void 0);
        _SignatureController_isEthSignEnabled.set(this, void 0);
        _SignatureController_getAllState.set(this, void 0);
        _SignatureController_messageManager.set(this, void 0);
        _SignatureController_personalMessageManager.set(this, void 0);
        _SignatureController_typedMessageManager.set(this, void 0);
        __classPrivateFieldSet(this, _SignatureController_keyringController, keyringController, "f");
        __classPrivateFieldSet(this, _SignatureController_isEthSignEnabled, isEthSignEnabled, "f");
        __classPrivateFieldSet(this, _SignatureController_getAllState, getAllState, "f");
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _SignatureController_messageManager, new message_manager_1.MessageManager(undefined, undefined, securityProviderRequest), "f");
        __classPrivateFieldSet(this, _SignatureController_personalMessageManager, new message_manager_1.PersonalMessageManager(undefined, undefined, securityProviderRequest), "f");
        __classPrivateFieldSet(this, _SignatureController_typedMessageManager, new message_manager_1.TypedMessageManager(undefined, undefined, securityProviderRequest), "f");
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_handleMessageManagerEvents).call(this, __classPrivateFieldGet(this, _SignatureController_messageManager, "f"), controller_utils_1.ApprovalType.EthSign, 'unapprovedMessage');
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_handleMessageManagerEvents).call(this, __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f"), controller_utils_1.ApprovalType.PersonalSign, 'unapprovedPersonalMessage');
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_handleMessageManagerEvents).call(this, __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f"), controller_utils_1.ApprovalType.EthSignTypedData, 'unapprovedTypedMessage');
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_subscribeToMessageState).call(this, __classPrivateFieldGet(this, _SignatureController_messageManager, "f"), (state, newMessages, messageCount) => {
            state.unapprovedMsgs = newMessages;
            state.unapprovedMsgCount = messageCount;
        });
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_subscribeToMessageState).call(this, __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f"), (state, newMessages, messageCount) => {
            state.unapprovedPersonalMsgs = newMessages;
            state.unapprovedPersonalMsgCount = messageCount;
        });
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_subscribeToMessageState).call(this, __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f"), (state, newMessages, messageCount) => {
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
        return __classPrivateFieldGet(this, _SignatureController_messageManager, "f").getUnapprovedMessagesCount();
    }
    /**
     * A getter for the number of 'unapproved' PersonalMessages in this.messages.
     *
     * @returns The number of 'unapproved' PersonalMessages in this.messages
     */
    get unapprovedPersonalMessagesCount() {
        return __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f").getUnapprovedMessagesCount();
    }
    /**
     * A getter for the number of 'unapproved' TypedMessages in this.messages.
     *
     * @returns The number of 'unapproved' TypedMessages in this.messages
     */
    get unapprovedTypedMessagesCount() {
        return __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f").getUnapprovedMessagesCount();
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
            if (!__classPrivateFieldGet(this, _SignatureController_isEthSignEnabled, "f").call(this)) {
                throw eth_rpc_errors_1.ethErrors.rpc.methodNotFound('eth_sign has been disabled. You must enable it in the advanced settings');
            }
            const data = __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_normalizeMsgData).call(this, msgParams.data);
            // 64 hex + "0x" at the beginning
            // This is needed because Ethereum's EcSign works only on 32 byte numbers
            // For 67 length see: https://github.com/MetaMask/metamask-extension/pull/12679/files#r749479607
            if (data.length !== 66 && data.length !== 67) {
                throw eth_rpc_errors_1.ethErrors.rpc.invalidParams('eth_sign requires 32 byte message hash');
            }
            return __classPrivateFieldGet(this, _SignatureController_messageManager, "f").addUnapprovedMessageAsync(msgParams, req);
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
            return __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f").addUnapprovedMessageAsync(msgParams, req);
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
            return __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f").addUnapprovedMessageAsync(msgParams, version, req);
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
            return yield __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_signAbstractMessage).call(this, __classPrivateFieldGet(this, _SignatureController_messageManager, "f"), controller_utils_1.ApprovalType.EthSign, msgParams, (cleanMsgParams) => __awaiter(this, void 0, void 0, function* () { return yield __classPrivateFieldGet(this, _SignatureController_keyringController, "f").signMessage(cleanMsgParams); }));
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
            return yield __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_signAbstractMessage).call(this, __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f"), controller_utils_1.ApprovalType.PersonalSign, msgParams, (cleanMsgParams) => __awaiter(this, void 0, void 0, function* () { return yield __classPrivateFieldGet(this, _SignatureController_keyringController, "f").signPersonalMessage(cleanMsgParams); }));
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
            return yield __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_signAbstractMessage).call(this, __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f"), controller_utils_1.ApprovalType.EthSignTypedData, msgParams, (cleanMsgParams) => __awaiter(this, void 0, void 0, function* () {
                const finalMessageParams = opts.parseJsonData
                    ? __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_removeJsonData).call(this, cleanMsgParams, version)
                    : cleanMsgParams;
                return yield __classPrivateFieldGet(this, _SignatureController_keyringController, "f").signTypedMessage(finalMessageParams, {
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
        return __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_cancelAbstractMessage).call(this, __classPrivateFieldGet(this, _SignatureController_messageManager, "f"), msgId);
    }
    /**
     * Used to cancel a personal_sign type message.
     *
     * @param msgId - The ID of the message to cancel.
     * @returns A full state update.
     */
    cancelPersonalMessage(msgId) {
        return __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_cancelAbstractMessage).call(this, __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f"), msgId);
    }
    /**
     * Used to cancel a eth_signTypedData type message.
     *
     * @param msgId - The ID of the message to cancel.
     * @returns A full state update.
     */
    cancelTypedMessage(msgId) {
        return __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_cancelAbstractMessage).call(this, __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f"), msgId);
    }
    /**
     * Reject all unapproved messages of any type.
     *
     * @param reason - A message to indicate why.
     */
    rejectUnapproved(reason) {
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_rejectUnapproved).call(this, __classPrivateFieldGet(this, _SignatureController_messageManager, "f"), reason);
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_rejectUnapproved).call(this, __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f"), reason);
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_rejectUnapproved).call(this, __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f"), reason);
    }
    /**
     * Clears all unapproved messages from memory.
     */
    clearUnapproved() {
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_clearUnapproved).call(this, __classPrivateFieldGet(this, _SignatureController_messageManager, "f"));
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_clearUnapproved).call(this, __classPrivateFieldGet(this, _SignatureController_personalMessageManager, "f"));
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_clearUnapproved).call(this, __classPrivateFieldGet(this, _SignatureController_typedMessageManager, "f"));
    }
}
exports.SignatureController = SignatureController;
_SignatureController_keyringController = new WeakMap(), _SignatureController_isEthSignEnabled = new WeakMap(), _SignatureController_getAllState = new WeakMap(), _SignatureController_messageManager = new WeakMap(), _SignatureController_personalMessageManager = new WeakMap(), _SignatureController_typedMessageManager = new WeakMap(), _SignatureController_instances = new WeakSet(), _SignatureController_rejectUnapproved = function _SignatureController_rejectUnapproved(messageManager, reason) {
    Object.keys(messageManager.getUnapprovedMessages()).forEach((messageId) => {
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_cancelAbstractMessage).call(this, messageManager, messageId, reason);
    });
}, _SignatureController_clearUnapproved = function _SignatureController_clearUnapproved(messageManager) {
    messageManager.update({
        unapprovedMessages: {},
        unapprovedMessagesCount: 0,
    });
}, _SignatureController_signAbstractMessage = function _SignatureController_signAbstractMessage(messageManager, methodName, msgParams, getSignature) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`MetaMaskController - ${methodName}`);
        const messageId = msgParams.metamaskId;
        try {
            const cleanMessageParams = yield messageManager.approveMessage(msgParams);
            const signature = yield getSignature(cleanMessageParams);
            messageManager.setMessageStatusSigned(messageId, signature);
            __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_acceptApproval).call(this, messageId);
            return __classPrivateFieldGet(this, _SignatureController_getAllState, "f").call(this);
        }
        catch (error) {
            console.info(`MetaMaskController - ${methodName} failed.`, error);
            __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_errorMessage).call(this, messageManager, messageId, error.message);
            throw error;
        }
    });
}, _SignatureController_errorMessage = function _SignatureController_errorMessage(messageManager, messageId, error) {
    if (messageManager instanceof message_manager_1.TypedMessageManager) {
        messageManager.setMessageStatusErrored(messageId, error);
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_rejectApproval).call(this, messageId);
    }
    else {
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_cancelAbstractMessage).call(this, messageManager, messageId);
    }
}, _SignatureController_cancelAbstractMessage = function _SignatureController_cancelAbstractMessage(messageManager, messageId, reason) {
    if (reason) {
        const message = __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_getMessage).call(this, messageId);
        this.hub.emit('cancelWithReason', { message, reason });
    }
    messageManager.rejectMessage(messageId);
    __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_rejectApproval).call(this, messageId);
    return __classPrivateFieldGet(this, _SignatureController_getAllState, "f").call(this);
}, _SignatureController_handleMessageManagerEvents = function _SignatureController_handleMessageManagerEvents(messageManager, approvalType, eventName) {
    messageManager.hub.on('updateBadge', () => {
        this.hub.emit('updateBadge');
    });
    messageManager.hub.on('unapprovedMessage', (msgParams) => {
        this.hub.emit(eventName, msgParams);
        __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_requestApproval).call(this, msgParams, approvalType);
    });
}, _SignatureController_subscribeToMessageState = function _SignatureController_subscribeToMessageState(messageManager, updateState) {
    messageManager.subscribe((state) => {
        const newMessages = __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_migrateMessages).call(this, state.unapprovedMessages);
        this.update(() => {
            const newState = Object.assign({}, this.state);
            updateState(newState, newMessages, state.unapprovedMessagesCount);
            return newState;
        });
    });
}, _SignatureController_migrateMessages = function _SignatureController_migrateMessages(coreMessages) {
    const stateMessages = {};
    for (const messageId of Object.keys(coreMessages)) {
        const coreMessage = coreMessages[messageId];
        const stateMessage = __classPrivateFieldGet(this, _SignatureController_instances, "m", _SignatureController_migrateMessage).call(this, coreMessage);
        stateMessages[messageId] = stateMessage;
    }
    return stateMessages;
}, _SignatureController_migrateMessage = function _SignatureController_migrateMessage(coreMessage) {
    const { messageParams } = coreMessage, coreMessageData = __rest(coreMessage, ["messageParams"]);
    // Core message managers use messageParams but frontend uses msgParams with lots of references
    const stateMessage = Object.assign(Object.assign({}, coreMessageData), { msgParams: messageParams });
    return stateMessage;
}, _SignatureController_normalizeMsgData = function _SignatureController_normalizeMsgData(data) {
    if (data.slice(0, 2) === '0x') {
        // data is already hex
        return data;
    }
    // data is unicode, convert to hex
    return (0, ethereumjs_util_1.bufferToHex)(Buffer.from(data, 'utf8'));
}, _SignatureController_getMessage = function _SignatureController_getMessage(messageId) {
    return Object.assign(Object.assign(Object.assign({}, this.state.unapprovedMsgs), this.state.unapprovedPersonalMsgs), this.state.unapprovedTypedMessages)[messageId];
}, _SignatureController_requestApproval = function _SignatureController_requestApproval(msgParams, type) {
    const id = msgParams.metamaskId;
    const origin = msgParams.origin || controller_utils_1.ORIGIN_METAMASK;
    this.messagingSystem
        .call('ApprovalController:addRequest', {
        id,
        origin,
        type,
    }, true)
        .catch(() => {
        // Intentionally ignored as promise not currently used
    });
}, _SignatureController_acceptApproval = function _SignatureController_acceptApproval(messageId) {
    this.messagingSystem.call('ApprovalController:acceptRequest', messageId);
}, _SignatureController_rejectApproval = function _SignatureController_rejectApproval(messageId) {
    this.messagingSystem.call('ApprovalController:rejectRequest', messageId, 'Cancel');
}, _SignatureController_removeJsonData = function _SignatureController_removeJsonData(messageParams, version) {
    if (version === 'V1' || typeof messageParams.data !== 'string') {
        return messageParams;
    }
    return Object.assign(Object.assign({}, messageParams), { data: JSON.parse(messageParams.data) });
};
//# sourceMappingURL=SignatureController.js.map