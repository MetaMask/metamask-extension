"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFeeLevel = exports.TransactionEnvelopeType = exports.TransactionType = exports.WalletDevice = exports.TransactionStatus = void 0;
/**
 * The status of the transaction. Each status represents the state of the transaction internally
 * in the wallet. Some of these correspond with the state of the transaction on the network, but
 * some are wallet-specific.
 */
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["approved"] = "approved";
    /** @deprecated Determined by the clients using the transaction type. No longer used. */
    TransactionStatus["cancelled"] = "cancelled";
    TransactionStatus["confirmed"] = "confirmed";
    TransactionStatus["dropped"] = "dropped";
    TransactionStatus["failed"] = "failed";
    TransactionStatus["rejected"] = "rejected";
    TransactionStatus["signed"] = "signed";
    TransactionStatus["submitted"] = "submitted";
    TransactionStatus["unapproved"] = "unapproved";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
/**
 * Options for wallet device.
 */
var WalletDevice;
(function (WalletDevice) {
    WalletDevice["MM_MOBILE"] = "metamask_mobile";
    WalletDevice["MM_EXTENSION"] = "metamask_extension";
    WalletDevice["OTHER"] = "other_device";
})(WalletDevice = exports.WalletDevice || (exports.WalletDevice = {}));
/**
 * The type of the transaction.
 */
var TransactionType;
(function (TransactionType) {
    /**
     * A transaction sending a network's native asset to a recipient.
     */
    TransactionType["cancel"] = "cancel";
    /**
     * A transaction that is interacting with a smart contract's methods that we
     * have not treated as a special case, such as approve, transfer, and
     * transferfrom.
     */
    TransactionType["contractInteraction"] = "contractInteraction";
    /**
     * A transaction that deployed a smart contract.
     */
    TransactionType["deployContract"] = "contractDeployment";
    /**
     * A transaction for Ethereum decryption.
     */
    TransactionType["ethDecrypt"] = "eth_decrypt";
    /**
     * A transaction for getting an encryption public key.
     */
    TransactionType["ethGetEncryptionPublicKey"] = "eth_getEncryptionPublicKey";
    /**
     * An incoming (deposit) transaction.
     */
    TransactionType["incoming"] = "incoming";
    /**
     * A transaction for personal sign.
     */
    TransactionType["personalSign"] = "personal_sign";
    /**
     * When a transaction is failed it can be retried by
     * resubmitting the same transaction with a higher gas fee. This type is also used
     * to speed up pending transactions. This is accomplished by creating a new tx with
     * the same nonce and higher gas fees.
     */
    TransactionType["retry"] = "retry";
    /**
     * A transaction sending a network's native asset to a recipient.
     */
    TransactionType["simpleSend"] = "simpleSend";
    /**
     * A transaction that is signing a message.
     */
    TransactionType["sign"] = "eth_sign";
    /**
     * A transaction that is signing typed data.
     */
    TransactionType["signTypedData"] = "eth_signTypedData";
    /**
     * A transaction sending a network's native asset to a recipient.
     */
    TransactionType["smart"] = "smart";
    /**
     * A transaction swapping one token for another through MetaMask Swaps.
     */
    TransactionType["swap"] = "swap";
    /**
     * Similar to the approve type, a swap approval is a special case of ERC20
     * approve method that requests an allowance of the token to spend on behalf
     * of the user for the MetaMask Swaps contract. The first swap for any token
     * will have an accompanying swapApproval transaction.
     */
    TransactionType["swapApproval"] = "swapApproval";
    /**
     * A token transaction requesting an allowance of the token to spend on
     * behalf of the user.
     */
    TransactionType["tokenMethodApprove"] = "approve";
    /**
     * A token transaction transferring tokens from an account that the sender
     * has an allowance of. The method is prefixed with safe because when calling
     * this method the contract checks to ensure that the receiver is an address
     * capable of handling the token being sent.
     */
    TransactionType["tokenMethodSafeTransferFrom"] = "safetransferfrom";
    /**
     * A token transaction where the user is sending tokens that they own to
     * another address.
     */
    TransactionType["tokenMethodTransfer"] = "transfer";
    /**
     * A token transaction transferring tokens from an account that the sender
     * has an allowance of. For more information on allowances, see the approve
     * type.
     */
    TransactionType["tokenMethodTransferFrom"] = "transferfrom";
    /**
     * A token transaction requesting an allowance of all of a user's tokens to
     * spend on behalf of the user.
     */
    TransactionType["tokenMethodSetApprovalForAll"] = "setapprovalforall";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
/**
 * Specifies the shape of the base transaction parameters.
 * Added in EIP-2718.
 */
var TransactionEnvelopeType;
(function (TransactionEnvelopeType) {
    /**
     * A legacy transaction, the very first type.
     */
    TransactionEnvelopeType["legacy"] = "0x0";
    /**
     * EIP-2930 defined the access list transaction type that allowed for
     * specifying the state that a transaction would act upon in advance and
     * theoretically save on gas fees.
     */
    TransactionEnvelopeType["accessList"] = "0x1";
    /**
     * The type introduced comes from EIP-1559, Fee Market describes the addition
     * of a baseFee to blocks that will be burned instead of distributed to
     * miners. Transactions of this type have both a maxFeePerGas (maximum total
     * amount in gwei per gas to spend on the transaction) which is inclusive of
     * the maxPriorityFeePerGas (maximum amount of gwei per gas from the
     * transaction fee to distribute to miner).
     */
    TransactionEnvelopeType["feeMarket"] = "0x2";
})(TransactionEnvelopeType = exports.TransactionEnvelopeType || (exports.TransactionEnvelopeType = {}));
/**
 * The source of the gas fee parameters on a transaction.
 */
var UserFeeLevel;
(function (UserFeeLevel) {
    UserFeeLevel["CUSTOM"] = "custom";
    UserFeeLevel["DAPP_SUGGESTED"] = "dappSuggested";
    UserFeeLevel["MEDIUM"] = "medium";
})(UserFeeLevel = exports.UserFeeLevel || (exports.UserFeeLevel = {}));
//# sourceMappingURL=types.js.map