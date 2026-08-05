import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  buildMoneyAccountWithdrawBatch,
  MUSD_DECIMALS,
} from '@metamask/money-account-utils';
import {
  TransactionType,
  updateEIP7702BatchData,
  type TransactionControllerState,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { calcTokenValue } from '../../../../../shared/lib/swaps-utils';
import { getMoneyPayContext, type MoneyPayMessenger } from './pay-context';

const UPDATE_ERROR_PREFIX = 'Update Amount: Money Account Withdrawal: ';

const amountUpdates = new Map<
  string,
  {
    intentKey: string;
    promise: Promise<boolean>;
    token: symbol;
  }
>();

function failUpdate(message: string): never {
  throw new Error(`${UPDATE_ERROR_PREFIX}${message}`);
}

/**
 * Asserts the transaction still matches the withdrawal template this updater
 * re-encodes: teller withdraw at index 0, ERC-20 transfer at index 1.
 *
 * @param transaction - The transaction to validate.
 */
function validateTransactionTemplate(transaction: TransactionMeta): void {
  if (
    transaction.nestedTransactions?.[0]?.type !==
      TransactionType.moneyAccountWithdraw ||
    transaction.nestedTransactions[1]?.type !==
      TransactionType.tokenMethodTransfer
  ) {
    failUpdate('missing withdraw/transfer transaction template');
  }
}

async function updateMoneyAccountWithdrawAmountInternal(
  messenger: MoneyPayMessenger,
  transaction: TransactionMeta,
  amountHuman: string,
  isCurrentIntent: () => boolean,
): Promise<boolean> {
  validateTransactionTemplate(transaction);

  const chainId = transaction.chainId as Hex;

  const context = getMoneyPayContext(messenger, chainId);
  if (!context) {
    failUpdate('missing vault config or provider');
  }
  const { moneyAccountAddress, vaultConfig, provider } = context;

  // ROUND_UP, matching mobile's withdraw amount updater — the ROUND_DOWN rule
  // applies only to the payment-override Max path, where the amount is bounded
  // by the withdrawable balance rather than typed by the user.
  const amountRaw = calcTokenValue(amountHuman, MUSD_DECIMALS)
    .round(0, BigNumber.ROUND_UP)
    .toFixed(0);

  // A cleared amount field arrives as zero; the builder throws on zero rather
  // than encoding a redemption of no shares.
  if (BigInt(amountRaw) === 0n) {
    return false;
  }

  // The redeemed mUSD is forwarded to the user's currently selected account,
  // resolved at commit time — the same rule as mobile's `selectEvmAddress`
  // default.
  // The cast mirrors `lib/transaction/hooks`: TS cannot narrow this action's
  // return type out of the messenger union.
  const recipient = (
    messenger.call('AccountsController:getSelectedAccount') as
      | InternalAccount
      | undefined
  )?.address as Hex | undefined;
  if (!recipient) {
    failUpdate('missing recipient account');
  }

  const { withdrawTx, transferTx } = await buildMoneyAccountWithdrawBatch({
    amount: BigInt(amountRaw),
    chainId,
    tellerAddress: vaultConfig.tellerAddress,
    accountantAddress: vaultConfig.accountantAddress,
    moneyAccountAddress,
    recipient,
    provider,
  });

  if (!isCurrentIntent()) {
    return false;
  }

  const withdrawData = withdrawTx.params.data;
  const transferData = transferTx.params.data;
  if (!withdrawData || !transferData) {
    failUpdate('incomplete withdraw/transfer updates');
  }

  messenger.call('TransactionController:updateTransactionMetadata', {
    transactionId: transaction.id,
    skipResimulate: true,
    callback: (transactionMeta: TransactionMeta) => {
      validateTransactionTemplate(transactionMeta);

      if (transactionMeta.chainId !== chainId) {
        failUpdate('transaction chain changed during preparation');
      }

      const { nestedTransactions, transactionData } = updateEIP7702BatchData({
        from: transactionMeta.txParams.from as Hex,
        transactions: transactionMeta.nestedTransactions ?? [],
        updates: [
          { transactionIndex: 0, transactionData: withdrawData },
          { transactionIndex: 1, transactionData: transferData },
        ],
      });

      transactionMeta.nestedTransactions = nestedTransactions;
      transactionMeta.txParams.data = transactionData;
      transactionMeta.txParams.gas = undefined;
      transactionMeta.gasLimitNoBuffer = undefined;
      transactionMeta.gasUsed = undefined;
      transactionMeta.securityAlertResponse = undefined;
      transactionMeta.simulationData = undefined;
      transactionMeta.simulationFails = undefined;

      if (transactionMeta.revert) {
        delete transactionMeta.revert.gas;
        delete transactionMeta.revert.simulation;

        if (!transactionMeta.revert.receipt) {
          transactionMeta.revert = undefined;
        }
      }
    },
  });

  return true;
}

/**
 * Prepares and atomically commits a Money Account withdrawal amount:
 * re-encodes the withdraw + transfer calldata for the new amount (which needs
 * the vault rate for the share conversion) and writes it into the transaction
 * in one `updateTransactionMetadata` call.
 *
 * The concurrency contract mirrors `updateMoneyAccountDepositAmount`:
 * identical in-flight intents share a promise, and a newer intent for the
 * same transaction prevents an older preparation from committing stale
 * calldata — the superseded call resolves `false`.
 *
 * @param messenger - The messenger to resolve and commit through.
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable amount.
 * @returns Whether this intent committed transaction metadata.
 */
export function updateMoneyAccountWithdrawAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
): Promise<boolean> {
  const { transactions } = messenger.call(
    'TransactionController:getState',
  ) as TransactionControllerState;
  const transaction = transactions.find(({ id }) => id === transactionId);
  if (!transaction) {
    failUpdate('transaction not found');
  }

  const intentKey = JSON.stringify({ amountHuman, transactionId });
  const existing = amountUpdates.get(transactionId);

  if (existing?.intentKey === intentKey) {
    return existing.promise;
  }

  const token = Symbol(intentKey);
  const isCurrentIntent = (): boolean =>
    amountUpdates.get(transactionId)?.token === token;
  const trackedPromise = updateMoneyAccountWithdrawAmountInternal(
    messenger,
    transaction,
    amountHuman,
    isCurrentIntent,
  ).finally(() => {
    if (isCurrentIntent()) {
      amountUpdates.delete(transactionId);
    }
  });

  amountUpdates.set(transactionId, {
    intentKey,
    promise: trackedPromise,
    token,
  });

  return trackedPromise;
}
