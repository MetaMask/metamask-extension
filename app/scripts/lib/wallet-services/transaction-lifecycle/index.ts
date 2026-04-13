/**
 * transaction-lifecycle
 *
 * Lifecycle hooks around TransactionController: post-submit NFT ownership
 * updates, STX routing, and transaction metrics. All controller access via
 * messenger — no chrome.* / browser.* imports.
 *
 * Remaining methods (13 total in MC, stubs shown):
 *   getTransactions, cancelTransaction, stopTransaction,
 *   updateTransactionSendFlowHistory, updateAndApproveTransaction,
 *   approveTransactionsWithSameNonce, createCancelTransaction,
 *   createSpeedUpTransaction, estimateGas, getBufferedGasLimit,
 *   updateEditableParams, handlePostTransactionBalanceUpdate,
 *   updateNftOwnershipOnPostTransactionBatch
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

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for transaction-lifecycle messenger actions. */
export const TRANSACTION_LIFECYCLE_ACTIONS = {
  updateNftOwnershipOnPostTransactionBatch:
    'TransactionLifecycle:updateNftOwnershipOnPostTransactionBatch',
  routeTransactionToSmartTransactionIfEnabled:
    'TransactionLifecycle:routeTransactionToSmartTransactionIfEnabled',
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
}
