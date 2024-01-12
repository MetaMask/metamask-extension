import { TransactionStatus } from '@metamask/transaction-controller';

/**
 * With this list we can detect if a transaction is still in progress.
 */
export const IN_PROGRESS_TRANSACTION_STATUSES = [
  TransactionStatus.unapproved,
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
/**
 * Status for finalized transactions.
 */
export const FINALIZED_TRANSACTION_STATUSES = [
  TransactionStatus.rejected,
  TransactionStatus.failed,
  TransactionStatus.dropped,
  TransactionStatus.confirmed,
];
///: END:ONLY_INCLUDE_IF

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

export enum AnonymousTransactionMetaMetricsEvent {
  added = 'Transaction Added Anon',
  approved = 'Transaction Approved Anon',
  finalized = 'Transaction Finalized Anon',
  rejected = 'Transaction Rejected Anon',
  submitted = 'Transaction Submitted Anon',
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
