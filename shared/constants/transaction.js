import { MESSAGE_TYPE } from './app';

/**
 * Transaction Type is a MetaMask construct used internally
 *
 * @typedef {object} TransactionTypes
 * @property {'transfer'} TOKEN_METHOD_TRANSFER - A token transaction where the user
 *  is sending tokens that they own to another address
 * @property {'transferfrom'} TOKEN_METHOD_TRANSFER_FROM - A token transaction
 *  transferring tokens from an account that the sender has an allowance of.
 *  For more information on allowances, see the approve type.
 * @property {'safetransferfrom'} TOKEN_METHOD_SAFE_TRANSFER_FROM - A token transaction
 *  transferring tokens from an account that the sender has an allowance of.
 *  The method is prefixed with safe because when calling this method the contract checks
 *  to ensure that the receiver is an address capable of handling with the token being sent.
 * @property {'approve'} TOKEN_METHOD_APPROVE - A token transaction requesting an
 *  allowance of the token to spend on behalf of the user
 * @property {'setapprovalforall'} TOKEN_METHOD_SET_APPROVAL_FOR_ALL - A token transaction requesting an
 *  allowance of all of a user's token to spend on behalf of the user
 * @property {'incoming'} INCOMING - An incoming (deposit) transaction
 * @property {'simpleSend'} SIMPLE_SEND - A transaction sending a network's native asset to a recipient
 * @property {'contractInteraction'} CONTRACT_INTERACTION - A transaction that is
 *  interacting with a smart contract's methods that we have not treated as a special
 *  case, such as approve, transfer, and transferfrom
 * @property {'contractDeployment'} DEPLOY_CONTRACT - A transaction that deployed
 *  a smart contract
 * @property {'swap'} SWAP - A transaction swapping one token for another through
 *  MetaMask Swaps
 * @property {'swapApproval'} SWAP_APPROVAL - Similar to the approve type, a swap
 *  approval is a special case of ERC20 approve method that requests an allowance of
 *  the token to spend on behalf of the user for the MetaMask Swaps contract. The first
 *  swap for any token will have an accompanying swapApproval transaction.
 * @property {'cancel'} CANCEL - A transaction submitted with the same nonce as a
 *  previous transaction, a higher gas price and a zeroed out send amount. Useful
 *  for users who accidentally send to erroneous addresses or if they send too much.
 * @property {'retry'} RETRY - When a transaction is failed it can be retried by
 *  resubmitting the same transaction with a higher gas fee. This type is also used
 *  to speed up pending transactions. This is accomplished by creating a new tx with
 *  the same nonce and higher gas fees.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above transaction types.
 *
 * @typedef {TransactionTypes[keyof TransactionTypes]} TransactionTypeString
 */

/**
 * @type {TransactionTypes}
 */
export const TRANSACTION_TYPES = {
  CANCEL: 'cancel',
  CONTRACT_INTERACTION: 'contractInteraction',
  DEPLOY_CONTRACT: 'contractDeployment',
  ETH_DECRYPT: MESSAGE_TYPE.ETH_DECRYPT,
  ETH_GET_ENCRYPTION_PUBLIC_KEY: MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY,
  INCOMING: 'incoming',
  PERSONAL_SIGN: MESSAGE_TYPE.PERSONAL_SIGN,
  RETRY: 'retry',
  SIGN: MESSAGE_TYPE.ETH_SIGN,
  SIGN_TYPED_DATA: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  SIMPLE_SEND: 'simpleSend',
  SMART: 'smart',
  SWAP: 'swap',
  SWAP_APPROVAL: 'swapApproval',
  TOKEN_METHOD_APPROVE: 'approve',
  TOKEN_METHOD_SAFE_TRANSFER_FROM: 'safetransferfrom',
  TOKEN_METHOD_TRANSFER: 'transfer',
  TOKEN_METHOD_TRANSFER_FROM: 'transferfrom',
  TOKEN_METHOD_SET_APPROVAL_FOR_ALL: 'setapprovalforall',
};

/**
 * In EIP-2718 typed transaction envelopes were specified, with the very first
 * typed envelope being 'legacy' and describing the shape of the base
 * transaction params that were hitherto the only transaction type sent on
 * Ethereum.
 *
 * @typedef {object} TransactionEnvelopeTypes
 * @property {'0x0'} LEGACY - A legacy transaction, the very first type.
 * @property {'0x1'} ACCESS_LIST - EIP-2930 defined the access list transaction
 *  type that allowed for specifying the state that a transaction would act
 *  upon in advance and theoretically save on gas fees.
 * @property {'0x2'} FEE_MARKET - The type introduced comes from EIP-1559,
 *  Fee Market describes the addition of a baseFee to blocks that will be
 *  burned instead of distributed to miners. Transactions of this type have
 *  both a maxFeePerGas (maximum total amount in gwei per gas to spend on the
 *  transaction) which is inclusive of the maxPriorityFeePerGas (maximum amount
 *  of gwei per gas from the transaction fee to distribute to miner).
 */

/**
 * @type {TransactionEnvelopeTypes}
 */
export const TRANSACTION_ENVELOPE_TYPES = {
  LEGACY: '0x0',
  ACCESS_LIST: '0x1',
  FEE_MARKET: '0x2',
};

/**
 * Transaction Status is a mix of Ethereum and MetaMask terminology, used internally
 * for transaction processing.
 *
 * @typedef {object} TransactionStatuses
 * @property {'unapproved'} UNAPPROVED - A new transaction that the user has not
 *  approved or rejected
 * @property {'approved'} APPROVED - The user has approved the transaction in the
 *  MetaMask UI
 * @property {'rejected'} REJECTED - The user has rejected the transaction in the
 *  MetaMask UI
 * @property {'signed'} SIGNED - The transaction has been signed
 * @property {'submitted'} SUBMITTED - The transaction has been submitted to network
 * @property {'failed'} FAILED - The transaction has failed for some reason
 * @property {'dropped'} DROPPED - The transaction was dropped due to a tx with same
 *  nonce being accepted
 * @property {'confirmed'} CONFIRMED - The transaction was confirmed by the network
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above transaction statuses.
 *
 * @typedef {TransactionStatuses[keyof TransactionStatuses]} TransactionStatusString
 */

/**
 * @type {TransactionStatuses}
 */
export const TRANSACTION_STATUSES = {
  UNAPPROVED: 'unapproved',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SIGNED: 'signed',
  SUBMITTED: 'submitted',
  FAILED: 'failed',
  DROPPED: 'dropped',
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
};

/**
 * With this list we can detect if a transaction is still in progress.
 */
export const IN_PROGRESS_TRANSACTION_STATUSES = [
  TRANSACTION_STATUSES.UNAPPROVED,
  TRANSACTION_STATUSES.APPROVED,
  TRANSACTION_STATUSES.SIGNED,
  TRANSACTION_STATUSES.SUBMITTED,
  TRANSACTION_STATUSES.PENDING,
];

/**
 * Transaction Group Status is a MetaMask construct to track the status of groups
 * of transactions.
 *
 * @typedef {object} TransactionGroupStatuses
 * @property {'cancelled'} CANCELLED - A cancel type transaction in the group was
 *  confirmed
 * @property {'pending'} PENDING - The primaryTransaction of the group has a status
 *  that is one of TRANSACTION_STATUSES.APPROVED, TRANSACTION_STATUSES.UNAPPROVED
 *  or TRANSACTION_STATUSES.SUBMITTED
 */

/**
 * @type {TransactionGroupStatuses}
 */
export const TRANSACTION_GROUP_STATUSES = {
  CANCELLED: 'cancelled',
  PENDING: 'pending',
};

/**
 * Statuses that are specific to Smart Transactions.
 *
 * @typedef {object} SmartTransactionStatuses
 * @property {'cancelled'} CANCELLED - It can be cancelled for various reasons.
 * @property {'pending'} PENDING - Smart transaction is being processed.
 * @property {'success'} SUCCESS - Smart transaction was successfully mined.
 */

/**
 * @type {SmartTransactionStatuses}
 */
export const SMART_TRANSACTION_STATUSES = {
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  SUCCESS: 'success',
};

/**
 * Transaction Group Category is a MetaMask construct to categorize the intent
 * of a group of transactions for purposes of displaying in the UI
 *
 * @typedef {object} TransactionGroupCategories
 * @property {'send'} SEND - Transaction group representing ether being sent from
 *  the user.
 * @property {'receive'} RECEIVE - Transaction group representing a deposit/incoming
 *  transaction. This category maps 1:1 with TRANSACTION_CATEGORIES.INCOMING.
 * @property {'interaction'} INTERACTION - Transaction group representing
 *  an interaction with a smart contract's methods.
 * @property {'approval'} APPROVAL - Transaction group representing a request for an
 *  allowance of a token to spend on the user's behalf.
 * @property {'signature-request'} SIGNATURE_REQUEST - Transaction group representing
 *  a signature request This currently only shows up in the UI when its pending user
 *  approval in the UI. Once the user approves or rejects it will no longer show in
 *  activity.
 * @property {'swap'} SWAP - Transaction group representing a token swap through
 *  MetaMask Swaps. This transaction group's primary currency changes depending
 *  on context. If the user is viewing an asset page for a token received from a swap,
 *  the primary currency will be the received token. Otherwise the token exchanged
 *  will be shown.
 */

/**
 * @type {TransactionGroupCategories}
 */
export const TRANSACTION_GROUP_CATEGORIES = {
  APPROVAL: 'approval',
  INTERACTION: 'interaction',
  RECEIVE: 'receive',
  SEND: 'send',
  SIGNATURE_REQUEST: 'signature-request',
  SWAP: 'swap',
};

/**
 * @typedef {object} TxParams
 * @property {string} from - The address the transaction is sent from
 * @property {string} to - The address the transaction is sent to
 * @property {string} value - The amount of wei, in hexadecimal, to send
 * @property {number} nonce - The transaction count for the current account/network
 * @property {string} gasPrice - The amount of gwei, in hexadecimal, per unit of gas
 * @property {string} gas - The max amount of gwei, in hexadecimal, the user is willing to pay
 * @property {string} [data] - Hexadecimal encoded string representing calls to the EVM's ABI
 */

/**
 * @typedef {object} TxError
 * @property {string} message - The message from the encountered error.
 * @property {any} rpc - The "value" of the error.
 * @property {string} [stack] - the stack trace from the error, if available.
 */

/**
 * An object representing a transaction, in whatever state it is in.
 *
 * @typedef {object} TransactionMeta
 * @property {string} [blockNumber] - The block number this transaction was
 *  included in. Currently only present on incoming transactions!
 * @property {number} id - An internally unique tx identifier.
 * @property {number} time - Time the transaction was first suggested, in unix
 *  epoch time (ms).
 * @property {TransactionTypeString} type - The type of transaction this txMeta
 *  represents.
 * @property {TransactionStatusString} status - The current status of the
 *  transaction.
 * @property {string} metamaskNetworkId - The transaction's network ID, used
 *  for EIP-155 compliance.
 * @property {boolean} loadingDefaults - TODO: Document
 * @property {TxParams} txParams - The transaction params as passed to the
 *  network provider.
 * @property {object[]} history - A history of mutations to this
 *  TransactionMeta object.
 * @property {string} origin - A string representing the interface that
 *  suggested the transaction.
 * @property {string} originalGasEstimate - A string representing the original
 * gas estimation on the transaction metadata.
 * @property {boolean} userEditedGasLimit - A boolean representing when the
 * user manually edited the gas limit.
 * @property {object} nonceDetails - A metadata object containing information
 *  used to derive the suggested nonce, useful for debugging nonce issues.
 * @property {string} rawTx - A hex string of the final signed transaction,
 *  ready to submit to the network.
 * @property {string} hash - A hex string of the transaction hash, used to
 *  identify the transaction on the network.
 * @property {number} [submittedTime] - The time the transaction was submitted to
 *  the network, in Unix epoch time (ms).
 * @property {TxError} [err] - The error encountered during the transaction
 */

/**
 * Defines the possible types
 *
 * @typedef {object} TransactionMetaMetricsEvents
 * @property {'Transaction Added'} ADDED - All transactions, except incoming
 *  ones, are added to the controller state in an unapproved status. When this
 *  happens we fire the Transaction Added event to show that the transaction
 *  has been added to the user's MetaMask.
 * @property {'Transaction Approved'} APPROVED - When an unapproved transaction
 *  is in the controller state, MetaMask will render a confirmation screen for
 *  that transaction. If the user approves the transaction we fire this event
 *  to indicate that the user has approved the transaction for submission to
 *  the network.
 * @property {'Transaction Rejected'} REJECTED - When an unapproved transaction
 *  is in the controller state, MetaMask will render a confirmation screen for
 *  that transaction. If the user rejects the transaction we fire this event
 *  to indicate that the user has rejected the transaction. It will be removed
 *  from state as a result.
 * @property {'Transaction Submitted'} SUBMITTED - After a transaction is
 *  approved by the user, it is then submitted to the network for inclusion in
 *  a block. When this happens we fire the Transaction Submitted event to
 *  indicate that MetaMask is submitting a transaction at the user's request.
 * @property {'Transaction Finalized'} FINALIZED - All transactions that are
 *  submitted will finalized (eventually) by either being dropped, failing
 *  or being confirmed. When this happens we track this event, along with the
 *  status.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above transaction event types.
 *
 * @typedef {TransactionMetaMetricsEvents[keyof TransactionMetaMetricsEvents]} TransactionMetaMetricsEventString
 */

/**
 * @type {TransactionMetaMetricsEvents}
 */
export const TRANSACTION_EVENTS = {
  ADDED: 'Transaction Added',
  APPROVED: 'Transaction Approved',
  FINALIZED: 'Transaction Finalized',
  REJECTED: 'Transaction Rejected',
  SUBMITTED: 'Transaction Submitted',
};

/**
 * @typedef {object} AssetTypes
 * @property {'NATIVE'} NATIVE - The native asset for the current network, such
 *  as ETH
 * @property {'TOKEN'} TOKEN - An ERC20 token.
 * @property {'COLLECTIBLE'} COLLECTIBLE - An ERC721 or ERC1155 token.
 * @property {'UNKNOWN'} UNKNOWN - A transaction interacting with a contract
 *  that isn't a token method interaction will be marked as dealing with an
 *  unknown asset type.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above asset types
 *
 * @typedef {AssetTypes[keyof AssetTypes]} AssetTypesString
 */

/**
 * The types of assets that a user can send
 *
 * @type {AssetTypes}
 */
export const ASSET_TYPES = {
  NATIVE: 'NATIVE',
  TOKEN: 'TOKEN',
  COLLECTIBLE: 'COLLECTIBLE',
  UNKNOWN: 'UNKNOWN',
};
