import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { buildMoneyAccountWithdrawPlaceholderBatch } from '@metamask/money-account-utils';
import type { TransactionControllerState } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

const LOG_TAG = '[Money Account]';

/**
 * Creates the placeholder Money Account withdrawal batch: teller withdraw +
 * ERC-20 transfer with **no calldata**, re-encoded by
 * `updateMoneyAccountWithdrawAmount` once the user picks an amount. The
 * recipient is resolved there too — the placeholder carries no recipient, so
 * initiation needs neither the selected account nor a vault read.
 *
 * Mirrors `create-deposit-transaction.ts`, with two differences that follow
 * mobile: no `requiredAssets` (the withdrawal consumes the vault balance,
 * not a payment asset) and no caller-supplied batch id (withdrawals have no
 * deposit-intent map to key; the controller-generated id is used to resolve
 * the created transaction).
 *
 * @param messenger - The messenger to build and submit through.
 * @returns The id of the created transaction, for confirmation navigation.
 */
export async function createMoneyAccountWithdrawTransaction(
  messenger: MoneyPayMessenger,
): Promise<{ transactionId: string; batchId: Hex }> {
  const context = getMoneyPayContext(messenger);
  if (!context) {
    throw new Error(`${LOG_TAG} Money account withdrawal is not available`);
  }

  const { moneyAccountAddress, vaultConfig, networkClientId } = context;
  const { chainId, tellerAddress } = vaultConfig;

  const { withdrawTx, transferTx } = buildMoneyAccountWithdrawPlaceholderBatch({
    chainId,
    tellerAddress,
  });

  const { batchId } = await messenger.call(
    'TransactionController:addTransactionBatch',
    {
      disableHook: true,
      disableSequential: true,
      disableUpgrade: true,
      from: moneyAccountAddress,
      // The gas-station sponsorship exists on Monad mainnet only.
      isGasFeeSponsored: chainId === CHAIN_IDS.MONAD,
      isInternal: true,
      networkClientId,
      origin: ORIGIN_METAMASK,
      skipInitialGasEstimate: true,
      transactions: [withdrawTx, transferTx],
    },
  );

  // The cast mirrors `lib/transaction/hooks`: TS cannot narrow this action's
  // return type out of the messenger union.
  const { transactions } = messenger.call(
    'TransactionController:getState',
  ) as TransactionControllerState;
  const transaction = transactions.find(
    (tx) => tx.batchId?.toLowerCase() === batchId.toLowerCase(),
  );

  if (!transaction) {
    throw new Error(
      `${LOG_TAG} Withdrawal transaction not found after batch creation`,
    );
  }

  return { transactionId: transaction.id, batchId };
}
