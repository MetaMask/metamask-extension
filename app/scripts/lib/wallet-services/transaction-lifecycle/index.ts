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
