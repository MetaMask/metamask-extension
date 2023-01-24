import { AccessList } from '@ethereumjs/tx';

export enum TransactionType {
  /**
   * A transaction submitted with the same nonce as a previous transaction, a
   * higher gas price and a zeroed out send amount. Useful for users who
   * accidentally send to erroneous addresses or if they send too much.
   */
  cancel = 'cancel',
  /**
   * A transaction that is interacting with a smart contract's methods that we
   * have not treated as a special case, such as approve, transfer, and
   * transferfrom
   */
  contractInteraction = 'contractInteraction',
  /**
   * A transaction that deployed a smart contract
   */
  deployContract = 'contractDeployment',
  ethDecrypt = 'eth_decrypt',
  ethGetEncryptionPublicKey = 'eth_getEncryptionPublicKey',
  /**
   * An incoming (deposit) transaction
   */
  incoming = 'incoming',
  personalSign = 'personal_sign',
  /**
   * When a transaction is failed it can be retried by
   * resubmitting the same transaction with a higher gas fee. This type is also used
   * to speed up pending transactions. This is accomplished by creating a new tx with
   * the same nonce and higher gas fees.
   */
  retry = 'retry',
  sign = 'eth_sign',
  signTypedData = 'eth_signTypedData',
  /** A transaction sending a network's native asset to a recipient */
  simpleSend = 'simpleSend',
  smart = 'smart',
  /**
   * A transaction swapping one token for another through MetaMask Swaps
   */
  swap = 'swap',
  /**
   * Similar to the approve type, a swap approval is a special case of ERC20
   * approve method that requests an allowance of the token to spend on behalf
   * of the user for the MetaMask Swaps contract. The first swap for any token
   * will have an accompanying swapApproval transaction.
   */
  swapApproval = 'swapApproval',
  /**
   * A token transaction requesting an allowance of the token to spend on
   * behalf of the user
   */
  tokenMethodApprove = 'approve',
  /**
   * A token transaction transferring tokens from an account that the sender
   * has an allowance of. The method is prefixed with safe because when calling
   * this method the contract checks to ensure that the receiver is an address
   * capable of handling with the token being sent.
   */
  tokenMethodSafeTransferFrom = 'safetransferfrom',
  /**
   * A token transaction where the user is sending tokens that they own to
   * another address
   */
  tokenMethodTransfer = 'transfer',
  /**
   * A token transaction transferring tokens from an account that the sender
   * has an allowance of. For more information on allowances, see the approve
   * type.
   */
  tokenMethodTransferFrom = 'transferfrom',
  /**
   * A token transaction requesting an allowance of all of a user's token to
   * spend on behalf of the user
   */
  tokenMethodSetApprovalForAll = 'setapprovalforall',
}

/**
 * In EIP-2718 typed transaction envelopes were specified, with the very first
 * typed envelope being 'legacy' and describing the shape of the base
 * transaction params that were hitherto the only transaction type sent on
 * Ethereum.
 */
export enum TransactionEnvelopeType {
  /**
   * A legacy transaction, the very first type.
   */
  legacy = '0x0',
  /**
   * EIP-2930 defined the access list transaction type that allowed for
   * specifying the state that a transaction would act upon in advance and
   * theoretically save on gas fees.
   */
  accessList = '0x1',
  /**
   * The type introduced comes from EIP-1559, Fee Market describes the addition
   * of a baseFee to blocks that will be burned instead of distributed to
   * miners. Transactions of this type have both a maxFeePerGas (maximum total
   * amount in gwei per gas to spend on the transaction) which is inclusive of
   * the maxPriorityFeePerGas (maximum amount of gwei per gas from the
   * transaction fee to distribute to miner).
   */
  feeMarket = '0x2',
}

/**
 * Transaction Status is a mix of Ethereum and MetaMask terminology, used internally
 * for transaction processing.
 */
export enum TransactionStatus {
  /**
   * A new transaction that the user has not approved or rejected
   */
  unapproved = 'unapproved',
  /**
   * The user has approved the transaction in the MetaMask UI
   */
  approved = 'approved',
  /**
   * The user has rejected the transaction in the MetaMask UI
   */
  rejected = 'rejected',
  /**
   * The transaction has been signed
   */
  signed = 'signed',
  /**
   * The transaction has been submitted to network
   */
  submitted = 'submitted',
  /**
   * The transaction has failed for some reason
   */
  failed = 'failed',
  /**
   * The transaction was dropped due to a tx with same nonce being accepted
   */
  dropped = 'dropped',
  /**
   * The transaction was confirmed by the network
   */
  confirmed = 'confirmed',
  /**
   * The transaction has been signed and is waiting to either be confirmed,
   * dropped or failed. This is a "fake" status that we use to group statuses
   * that are very similar from the user's perspective (approved,
   * signed, submitted). The only notable case where approve and signed are
   * different from user perspective is in hardware wallets where the
   * transaction is signed on an external device. Otherwise signing happens
   * transparently to users.
   */
  pending = 'pending',
}

/**
 * With this list we can detect if a transaction is still in progress.
 */
export const IN_PROGRESS_TRANSACTION_STATUSES = [
  TransactionStatus.unapproved,
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
  TransactionStatus.pending,
];

/**
 * Transaction Group Status is a MetaMask construct to track the status of groups
 * of transactions.
 */
export enum TransactionGroupStatus {
  /**
   * A cancel type transaction in the group was confirmed
   */
  cancelled = 'cancelled',
  /**
   * The primaryTransaction of the group has a status that is one of
   * TransactionStatus.approved, TransactionStatus.unapproved or
   * TransactionStatus.submitted
   */
  pending = 'pending',
}

/**
 * Statuses that are specific to Smart Transactions.
 */
export enum SmartTransactionStatus {
  /** It can be cancelled for various reasons. */
  cancelled = 'cancelled',
  /** Smart transaction is being processed. */
  pending = 'pending',
  /** Smart transaction was successfully mined. */
  success = 'success',
}

/**
 * Types that are specific to the transaction approval amount.
 */
export enum TransactionApprovalAmountType {
  /** The user has edited the token amount. */
  custom = 'custom',
  /** The selected amount (either custom or dappProposed) is 0. */
  revoke = 'revoke',
  /** The dapp proposed token amount. */
  dappProposed = 'dapp_proposed',
}

/**
 * Transaction Group Category is a MetaMask construct to categorize the intent
 * of a group of transactions for purposes of displaying in the UI
 */
export enum TransactionGroupCategory {
  /**
   * Transaction group representing a request for an allowance of a token to
   * spend on the user's behalf.
   */
  approval = 'approval',
  /**
   * Transaction group representing an interaction with a smart contract's methods.
   */
  interaction = 'interaction',
  /**
   * Transaction group representing a deposit/incoming transaction. This
   * category maps 1:1 with TransactionType.incoming.
   */
  receive = 'receive',
  /**
   * Transaction group representing the network native currency being sent from
   * the user.
   */
  send = 'send',
  /**
   * Transaction group representing a signature request This currently only
   * shows up in the UI when its pending user approval in the UI. Once the user
   * approves or rejects it will no longer show in activity.
   */
  signatureRequest = 'signature-request',
  /**
   * Transaction group representing a token swap through MetaMask Swaps. This
   * transaction group's primary currency changes depending on context. If the
   * user is viewing an asset page for a token received from a swap, the
   * primary currency will be the received token. Otherwise the token exchanged
   * will be shown.
   */
  swap = 'swap',
}

/**
 * An object representing parameters of a transaction to submit to the network
 */
export interface TxParams {
  /** The address the transaction is sent from */
  from: string;
  /** The address the transaction is sent to */
  to: string;
  /** The amount of wei, in hexadecimal, to send */
  value: string;
  /** The transaction count for the current account/network */
  nonce: number;
  /** The amount of gwei, in hexadecimal, per unit of gas */
  gasPrice?: string;
  /** The max amount of gwei, in hexadecimal, the user is willing to pay */
  gas: string;
  /** Hexadecimal encoded string representing calls to the EVM's ABI */
  data?: string;
  /**
   * EIP-2930 https://eips.ethereum.org/EIPS/eip-2930 added the ability for
   * transactions to specify which addresses they will interact with and allows
   * for lower gas fees on specific opcodes. See the EIP for more details.
   */
  accessList?: AccessList;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface TxReceipt {
  blockHash?: string;
  blockNumber?: string;
  transactionIndex?: string;
}

export interface TxError {
  /** The message from the encountered error. */
  message: string;
  /** The "value" of the error. */
  rpc: any;
  /** the stack trace from the error, if available. */
  stack?: string;
}

/**
 * An object representing a transaction, in whatever state it is in.
 */
export interface TransactionMeta {
  /**
   * The block number this transaction was included in. Currently only present
   * on incoming transactions!
   */
  blockNumber?: string;
  /** An internally unique tx identifier. */
  id: number;
  /** Time the transaction was first suggested, in unix epoch time (ms). */
  time: number;
  /** A string representing a name of transaction contract method. */
  contractMethodName: string;
  /** The custom token amount is the amount set by the user */
  customTokenAmount: string;
  /** The dapp proposed token amount */
  dappProposedTokenAmount: string;
  /** The balance of the token that is being sent */
  currentTokenBalance: string;
  /** The original dapp proposed token approval amount before edit by user */
  originalApprovalAmount: string;
  /**
   * The chosen amount which will be the same as the originally proposed token
   * amount if the user does not edit the  amount or will be a custom token
   * amount set by the user
   */
  finalApprovalAmount: string;
  /** The type of transaction this txMeta represents. */
  type: TransactionType;
  /**
   * When we speed up a transaction, we set the type as Retry and we lose
   * information about type of transaction that is being set up, so we use
   * original type to track that information.
   */
  originalType: TransactionType;
  /** The current status of the transaction. */
  status: TransactionStatus;
  /** The transaction's network ID, used for EIP-155 compliance. */
  metamaskNetworkId: string;
  /** TODO: Find out what this is and document it */
  loadingDefaults: boolean;
  /** The transaction params as passed to the network provider. */
  txParams: TxParams;
  txReceipt: TxReceipt;
  /** A history of mutations to this TransactionMeta object. */
  history: Record<string, any>[];
  /** A string representing the interface that suggested the transaction. */
  origin: string;
  /**
   * A string representing the original gas estimation on the transaction
   * metadata.
   */
  originalGasEstimate: string;
  /** A boolean representing when the user manually edited the gas limit. */
  userEditedGasLimit: boolean;
  /**
   * A metadata object containing information used to derive the suggested
   * nonce, useful for debugging nonce issues.
   */
  nonceDetails: Record<string, any>;
  /**
   * A hex string of the final signed transaction, ready to submit to the
   * network.
   */
  rawTx: string;
  /**
   * A hex string of the transaction hash, used to identify the transaction
   * on the network.
   */
  hash: string;
  v?: string;
  r?: string;
  s?: string;
  /**
   * The time the transaction was submitted to the network, in Unix epoch time
   * (ms).
   */
  submittedTime?: number;
  /** The error encountered during the transaction */
  txErr?: TxError;
}

/**
 * Defines the possible types
 */
export enum TransactionMetaMetricsEvent {
  /**
   * All transactions, except incoming ones, are added to the controller state
   * in an unapproved status. When this happens we fire the Transaction Added
   * event to show that the transaction has been added to the user's MetaMask.
   */
  added = 'Transaction Added',
  /**
   * When an unapproved transaction is in the controller state, MetaMask will
   * render a confirmation screen for that transaction. If the user approves
   * the transaction we fire this event to indicate that the user has approved
   * the transaction for submission to the network.
   */
  approved = 'Transaction Approved',
  /**
   * All transactions that are submitted will finalized (eventually) by either
   * being dropped, failing or being confirmed. When this happens we track this
   * event, along with the status.
   */
  finalized = 'Transaction Finalized',
  /**
   * When an unapproved transaction is in the controller state, MetaMask will
   * render a confirmation screen for that transaction. If the user rejects the
   * transaction we fire this event to indicate that the user has rejected the
   * transaction. It will be removed from state as a result.
   */
  rejected = 'Transaction Rejected',
  /**
   * After a transaction is approved by the user, it is then submitted to the
   * network for inclusion in a block. When this happens we fire the
   * Transaction Submitted event to indicate that MetaMask is submitting a
   * transaction at the user's request.
   */
  submitted = 'Transaction Submitted',
}

/**
 * The types of assets that a user can send
 *
 * @type {AssetTypes}
 */
export enum AssetType {
  /** The native asset for the current network, such as ETH */
  native = 'NATIVE',
  /** An ERC20 token */
  token = 'TOKEN',
  /** An ERC721 or ERC1155 token. */
  NFT = 'NFT',
  /**
   * A transaction interacting with a contract that isn't a token method
   * interaction will be marked as dealing with an unknown asset type.
   */
  unknown = 'UNKNOWN',
}

/**
 * Describes the standard which a token conforms to.
 */
export enum TokenStandard {
  /** A token that conforms to the ERC20 standard. */
  ERC20 = 'ERC20',
  /** A token that conforms to the ERC721 standard. */
  ERC721 = 'ERC721',
  /** A token that conforms to the ERC1155 standard. */
  ERC1155 = 'ERC1155',
  /** Not a token, but rather the base asset of the selected chain. */
  none = 'NONE',
}
