import { TransactionStatus } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

/**
 * With this list we can detect if a transaction is still in progress.
 */
export const IN_PROGRESS_TRANSACTION_STATUSES = [
  TransactionStatus.unapproved,
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];

export const SIGNING_METHODS = Object.freeze([
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
]);

/**
 * Transaction Group Status is a MetaMask construct to track the status of groups
 * of transactions.
 */
export enum TransactionGroupStatus {
  /**
   * A cancel type transaction in the group was confirmed
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cancelled = 'cancelled',
  /**
   * The primaryTransaction of the group has a status that is one of
   * TransactionStatus.approved, TransactionStatus.unapproved or
   * TransactionStatus.submitted
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  pending = 'pending',
}

/**
 * Statuses that are specific to Smart Transactions.
 */
export enum SmartTransactionStatus {
  /** It can be cancelled for various reasons. */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cancelled = 'cancelled',
  /** Smart transaction is being processed. */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  pending = 'pending',
  /** Smart transaction was successfully mined. */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  success = 'success',
}

/**
 * Types that are specific to the transaction approval amount.
 */
export enum TransactionApprovalAmountType {
  /** The user has edited the token amount. */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  custom = 'custom',
  /** The selected amount (either custom or dappProposed) is 0. */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  revoke = 'revoke',
  /** The dapp proposed token amount. */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  approval = 'approval',
  /**
   * Transaction group representing an interaction with a smart contract's methods.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interaction = 'interaction',
  /**
   * Transaction group representing a deposit/incoming transaction. This
   * category maps 1:1 with TransactionType.incoming.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  receive = 'receive',
  /**
   * Transaction group representing the network native currency being sent from
   * the user.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  send = 'send',
  /**
   * Transaction group representing a signature request This currently only
   * shows up in the UI when its pending user approval in the UI. Once the user
   * approves or rejects it will no longer show in activity.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signatureRequest = 'signature-request',
  /**
   * Transaction group representing a token swap through MetaMask Swaps. This
   * transaction group's primary currency changes depending on context. If the
   * user is viewing an asset page for a token received from a swap, the
   * primary currency will be the received token. Otherwise the token exchanged
   * will be shown.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  swap = 'swap',
  /**
   * Transaction group representing a token swap through MetaMask Swaps, where the final token is sent to another address.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  swapAndSend = 'swapAndSend',
  /**
   * Transaction group representing a token bridge through MetaMask Bridge,
   * where the final token is sent to another chain.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  bridge = 'bridge',
  /**
   * Transaction group representing a redeposit (a send to ourselves), mainly used for consolidation.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  redeposit = 'redeposit',
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  added = 'Transaction Added',
  /**
   * When an unapproved transaction is in the controller state, MetaMask will
   * render a confirmation screen for that transaction. If the user approves
   * the transaction we fire this event to indicate that the user has approved
   * the transaction for submission to the network.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  approved = 'Transaction Approved',
  /**
   * All transactions that are submitted will finalized (eventually) by either
   * being dropped, failing or being confirmed. When this happens we track this
   * event, along with the status.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  finalized = 'Transaction Finalized',
  /**
   * When an unapproved transaction is in the controller state, MetaMask will
   * render a confirmation screen for that transaction. If the user rejects the
   * transaction we fire this event to indicate that the user has rejected the
   * transaction. It will be removed from state as a result.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rejected = 'Transaction Rejected',
  /**
   * After a transaction is approved by the user, it is then submitted to the
   * network for inclusion in a block. When this happens we fire the
   * Transaction Submitted event to indicate that MetaMask is submitting a
   * transaction at the user's request.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  submitted = 'Transaction Submitted',
}

export enum AnonymousTransactionMetaMetricsEvent {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  added = 'Transaction Added Anon',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  approved = 'Transaction Approved Anon',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  finalized = 'Transaction Finalized Anon',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rejected = 'Transaction Rejected Anon',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  submitted = 'Transaction Submitted Anon',
}

/**
 * The types of assets that a user can send
 *
 * @type {AssetTypes}
 */
export enum AssetType {
  /** The native asset for the current network, such as ETH */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  native = 'NATIVE',
  /** An ERC20 token */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token = 'TOKEN',
  /** An ERC721 or ERC1155 token. */
  NFT = 'NFT',
  /**
   * A transaction interacting with a contract that isn't a token method
   * interaction will be marked as dealing with an unknown asset type.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  none = 'NONE',
}

/**
 * The hostname used for Ethereum Mainnet transaction simulations, and for
 * retrieving metadata for transaction simulation supported networks.
 */
export const TX_SENTINEL_URL =
  'https://tx-sentinel-ethereum-mainnet.api.cx.metamask.io';

// To be moved to @metamask/rpc-errors in future.
export enum EIP5792ErrorCode {
  UnsupportedNonOptionalCapability = 5700,
  UnsupportedChainId = 5710,
  UnknownBundleId = 5730,
  RejectedUpgrade = 5750,
}

export const APPROVAL_METHOD_NAMES = [
  'approve',
  'increaseAllowance',
  'setApprovalForAll',
];

export const NATIVE_TOKEN_ADDRESS = '0x0'.padEnd(42, '0') as Hex;
