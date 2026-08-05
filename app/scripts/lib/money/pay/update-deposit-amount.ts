import { toHex } from '@metamask/controller-utils';
import {
  buildMoneyAccountDepositBatch,
  getMoneyAccountDepositAssetAddress,
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

const UPDATE_ERROR_PREFIX = 'Update Amount: Money Account Deposit: ';

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
 * Asserts the transaction still matches the deposit template this updater
 * re-encodes: approve at index 0, deposit at index 1. Anything else means the
 * transaction is not the placeholder batch this flow created, and writing
 * calldata into it would corrupt a different transaction.
 *
 * @param transaction - The transaction to validate.
 */
function validateTransactionTemplate(transaction: TransactionMeta): void {
  if (
    transaction.nestedTransactions?.[0]?.type !==
      TransactionType.tokenMethodApprove ||
    transaction.nestedTransactions[1]?.type !==
      TransactionType.moneyAccountDeposit
  ) {
    failUpdate('missing approval/deposit transaction template');
  }
}

function buildRequiredAssets(
  transaction: TransactionMeta,
  depositAssetAddress: Hex,
  amountRaw: string,
) {
  const { requiredAssets } = transaction;
  if (!requiredAssets?.length) {
    failUpdate('missing required asset template');
  }

  const depositAssetIndex = requiredAssets.findIndex(
    ({ address }) =>
      address.toLowerCase() === depositAssetAddress.toLowerCase(),
  );
  if (depositAssetIndex === -1) {
    failUpdate('missing Money Account deposit asset template');
  }

  return requiredAssets.map((asset, index) =>
    index === depositAssetIndex
      ? { ...asset, amount: toHex(amountRaw) }
      : { ...asset },
  );
}

async function updateMoneyAccountDepositAmountInternal(
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
  const { vaultConfig, provider } = context;

  // ROUND_UP (never short the user), via `.round` — bignumber 4's
  // `decimalPlaces(0, mode)` is a getter that would return a count here.
  const amountRaw = calcTokenValue(amountHuman, MUSD_DECIMALS)
    .round(0, BigNumber.ROUND_UP)
    .toFixed(0);

  // A cleared amount field arrives as zero. The builder throws on zero rather
  // than encoding a deposit that mints nothing, so resolve "did not commit"
  // instead of building.
  if (BigInt(amountRaw) === 0n) {
    return false;
  }

  const depositAssetAddress = getMoneyAccountDepositAssetAddress(chainId);
  const buildResult = await buildMoneyAccountDepositBatch({
    amount: BigInt(amountRaw),
    chainId,
    boringVault: vaultConfig.boringVault,
    tellerAddress: vaultConfig.tellerAddress,
    accountantAddress: vaultConfig.accountantAddress,
    lensAddress: vaultConfig.lensAddress,
    provider,
  });

  if (!isCurrentIntent()) {
    return false;
  }

  const approveData = buildResult.approveTx?.params.data;
  const depositData = buildResult.depositTx?.params.data;
  if (!approveData || !depositData) {
    failUpdate('incomplete approval/deposit updates');
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
          { transactionIndex: 0, transactionData: approveData },
          { transactionIndex: 1, transactionData: depositData },
        ],
      });

      transactionMeta.nestedTransactions = nestedTransactions;
      transactionMeta.requiredAssets = buildRequiredAssets(
        transactionMeta,
        depositAssetAddress,
        amountRaw,
      );
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
 * Prepares and atomically commits a Money Account deposit amount: re-encodes
 * the approve + deposit calldata for the new amount (which needs a vault read
 * for the share preview) and writes it into the transaction in one
 * `updateTransactionMetadata` call.
 *
 * Identical in-flight intents share a promise; a newer intent for the same
 * transaction prevents an older, still-running preparation from committing
 * stale calldata — the superseded call resolves `false`.
 *
 * The transaction is resolved from `TransactionController` state by id at
 * call time (the UI invokes this over the background API, so an id is the
 * honest input — a serialized meta would be stale by the time it arrived).
 *
 * @param messenger - The messenger to resolve and commit through.
 * @param transactionId - Id of the Money Account deposit transaction.
 * @param amountHuman - Exact human-readable amount.
 * @returns Whether this intent committed transaction metadata.
 */
export function updateMoneyAccountDepositAmount(
  messenger: MoneyPayMessenger,
  transactionId: string,
  amountHuman: string,
): Promise<boolean> {
  // The cast mirrors `lib/transaction/hooks`: TS cannot narrow this action's
  // return type out of the messenger union.
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
  const trackedPromise = updateMoneyAccountDepositAmountInternal(
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
