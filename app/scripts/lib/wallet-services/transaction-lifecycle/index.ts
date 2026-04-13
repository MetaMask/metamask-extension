/**
 * transaction-lifecycle
 *
 * Lifecycle hooks around TransactionController: cancel/speed-up, STX routing,
 * NFT ownership updates, gas estimation, and transaction metrics.
 * All controller access via messenger — no chrome.* / browser.* imports.
 */

import type { RootMessenger } from '../../messenger';

export type TransactionLifecycleDependencies = {
  messenger: RootMessenger;
};

/**
 * Updates NFT ownership records after a batch of confirmed transactions.
 * Queries NftController for tokens held at the sender address and checks
 * whether any transferred to a different owner.
 *
 * Extracted from MetamaskController.updateNftOwnershipOnPostTransactionBatch.
 *
 * TODO: Requires messenger actions:
 *   - NftController:checkAndUpdateAllNftsOwnershipStatus
 *   - AccountsController:getSelectedAccount
 */
export async function updateNftOwnershipOnPostTransactionBatch(
  deps: TransactionLifecycleDependencies,
  txMetas: { txParams: { from: string } }[],
): Promise<void> {
  const senders = [...new Set(txMetas.map((tx) => tx.txParams.from))];
  for (const address of senders) {
    await deps.messenger.call(
      'NftController:checkAndUpdateAllNftsOwnershipStatus',
      address,
    );
  }
}

/**
 * Routes a transaction through the Smart Transactions Controller if STX
 * is enabled for the origin, otherwise falls through to normal submission.
 *
 * Extracted from MetamaskController smart transaction routing logic.
 *
 * TODO: Requires messenger actions:
 *   - SmartTransactionsController:submitSignedTransactions
 *   - TransactionController:approveTransaction
 */
export async function routeTransactionToSmartTransactionIfEnabled(
  deps: TransactionLifecycleDependencies,
  txId: string,
  opts: { useSmartTransaction: boolean },
): Promise<void> {
  if (opts.useSmartTransaction) {
    await deps.messenger.call(
      'SmartTransactionsController:submitSignedTransactions',
      txId,
    );
  } else {
    await deps.messenger.call('TransactionController:approveTransaction', txId);
  }
}

/**
 * Creates a cancel transaction — submits a replacement with the same nonce
 * at a higher gas price to replace the original.
 *
 * Returns the state snapshot so the UI can update immediately.
 *
 * Extracted from MetamaskController.createCancelTransaction.
 *
 * TODO: Requires messenger action: TransactionController:stopTransaction
 */
export async function createCancelTransaction(
  deps: TransactionLifecycleDependencies,
  originalTxId: string,
  customGasSettings: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:stopTransaction',
    originalTxId,
    customGasSettings,
    options,
  );
}

/**
 * Creates a speed-up transaction — submits a replacement with the same nonce
 * at a higher gas price to accelerate the original.
 *
 * Extracted from MetamaskController.createSpeedUpTransaction.
 *
 * TODO: Requires messenger action: TransactionController:speedUpTransaction
 */
export async function createSpeedUpTransaction(
  deps: TransactionLifecycleDependencies,
  originalTxId: string,
  customGasSettings: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:speedUpTransaction',
    originalTxId,
    customGasSettings,
    options,
  );
}

/**
 * Approves all pending transactions that share the same nonce as the given
 * transaction. Used to handle nonce conflicts during batch submission.
 *
 * Extracted from MetamaskController getApi() approveTransactionsWithSameNonce.
 *
 * TODO: Requires messenger action: TransactionController:approveTransactionsWithSameNonce
 */
export async function approveTransactionsWithSameNonce(
  deps: TransactionLifecycleDependencies,
  txIds: string[],
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:approveTransactionsWithSameNonce',
    txIds,
  );
}

/**
 * Estimates gas for a transaction using the current network provider.
 *
 * Extracted from MetamaskController.estimateGas.
 *
 * TODO: Requires a NetworkController provider access action or
 *   TransactionController:estimateGas to be exposed as a messenger action.
 */
export async function estimateGas(
  deps: TransactionLifecycleDependencies,
  params: unknown,
): Promise<string> {
  return (deps.messenger as never).call(
    'NetworkController:estimateGas',
    params,
  );
}

/**
 * Returns pending smart transactions for a given address.
 * Used to show external (STX) pending transactions in the UI.
 *
 * Extracted from MetamaskController.getExternalPendingTransactions.
 *
 * TODO: Requires messenger action: SmartTransactionsController:getTransactions
 */
export function getExternalPendingTransactions(
  deps: TransactionLifecycleDependencies,
  address: string,
): unknown[] {
  return (deps.messenger as never).call(
    'SmartTransactionsController:getTransactions',
    {
      addressFrom: address,
      status: 'pending',
    },
  );
}

/**
 * Editable transaction params update — updates gas, recipient, data, or value
 * on a pending transaction before approval.
 *
 * Extracted from MetamaskController getApi() applyTransactionContainersExisting
 * (delegated to txController.updateEditableParams).
 *
 * TODO: Requires messenger action: TransactionController:updateEditableParams
 */
export async function updateEditableParams(
  deps: TransactionLifecycleDependencies,
  txId: string,
  params: Record<string, unknown>,
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:updateEditableParams',
    txId,
    params,
  );
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for transaction-lifecycle messenger actions. */
export const TRANSACTION_LIFECYCLE_ACTIONS = {
  updateNftOwnershipOnPostTransactionBatch:
    'TransactionLifecycle:updateNftOwnershipOnPostTransactionBatch',
  routeTransactionToSmartTransactionIfEnabled:
    'TransactionLifecycle:routeTransactionToSmartTransactionIfEnabled',
  createCancelTransaction: 'TransactionLifecycle:createCancelTransaction',
  createSpeedUpTransaction: 'TransactionLifecycle:createSpeedUpTransaction',
  approveTransactionsWithSameNonce:
    'TransactionLifecycle:approveTransactionsWithSameNonce',
  estimateGas: 'TransactionLifecycle:estimateGas',
  getExternalPendingTransactions:
    'TransactionLifecycle:getExternalPendingTransactions',
  updateEditableParams: 'TransactionLifecycle:updateEditableParams',
} as const;

/**
 * Registers all transaction-lifecycle functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: RootMessenger): void {
  const deps: TransactionLifecycleDependencies = { messenger };
  // Cast to never because RootMessenger type doesn't yet include these action names.
  // TODO: Add TransactionLifecycleActions to RootMessenger allowed-actions type.
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.updateNftOwnershipOnPostTransactionBatch,
    (txMetas: { txParams: { from: string } }[]) =>
      updateNftOwnershipOnPostTransactionBatch(deps, txMetas),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.routeTransactionToSmartTransactionIfEnabled,
    (txId: string, opts: { useSmartTransaction: boolean }) =>
      routeTransactionToSmartTransactionIfEnabled(deps, txId, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.createCancelTransaction,
    (
      originalTxId: string,
      customGasSettings: Record<string, unknown>,
      options: Record<string, unknown>,
    ) =>
      createCancelTransaction(deps, originalTxId, customGasSettings, options),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.createSpeedUpTransaction,
    (
      originalTxId: string,
      customGasSettings: Record<string, unknown>,
      options: Record<string, unknown>,
    ) =>
      createSpeedUpTransaction(deps, originalTxId, customGasSettings, options),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.approveTransactionsWithSameNonce,
    (txIds: string[]) => approveTransactionsWithSameNonce(deps, txIds),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.estimateGas,
    (params: unknown) => estimateGas(deps, params),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.getExternalPendingTransactions,
    (address: string) => getExternalPendingTransactions(deps, address),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.updateEditableParams,
    (txId: string, params: Record<string, unknown>) =>
      updateEditableParams(deps, txId, params),
  );
}
