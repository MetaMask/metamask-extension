import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { isMusdOnMoneyAccountChain } from '@metamask/money-account-utils';
import type { Hex } from '@metamask/utils';
import { isMusdToken } from '../../components/app/musd/constants';
import type { MoneyAccountDepositIntent } from './deposit-intent';

/**
 * The first nested transaction matching a given TransactionType, or undefined
 * if none exists.
 *
 * @param transactionMeta - Transaction metadata.
 * @param targetType - The nested transaction type to look for.
 */
export const nestedTxWithType = (
  transactionMeta: TransactionMeta,
  targetType: TransactionType,
) =>
  transactionMeta.nestedTransactions?.find(
    (nested) => nested.type === targetType,
  );

export const isMoneyDepositTx = (transactionMeta: TransactionMeta) =>
  transactionMeta.type === TransactionType.moneyAccountDeposit ||
  Boolean(
    nestedTxWithType(transactionMeta, TransactionType.moneyAccountDeposit),
  );

/**
 * Derives the deposit intent from the transaction's payment data.
 *
 * @param transactionMeta - The deposit batch transaction.
 */
export const resolveMoneyDepositIntent = (
  transactionMeta: TransactionMeta,
): MoneyAccountDepositIntent => {
  if (transactionMeta.metamaskPay?.fiat) {
    return 'card';
  }
  if (isMusdToken(transactionMeta.metamaskPay?.tokenAddress)) {
    return 'addMusd';
  }
  return 'convert';
};

export const isMoneyWithdrawTx = (transactionMeta: TransactionMeta) =>
  transactionMeta.type === TransactionType.moneyAccountWithdraw ||
  Boolean(
    nestedTxWithType(transactionMeta, TransactionType.moneyAccountWithdraw),
  );

export const isMoneyAccountTx = (transactionMeta: TransactionMeta) =>
  isMoneyDepositTx(transactionMeta) || isMoneyWithdrawTx(transactionMeta);

/**
 * True for a transaction submitted on behalf of a money account batch, such as
 * the relay deposit that funds it or the vault deposit that follows it. These
 * children do not reference their parent, so the link is found from the
 * parent's `requiredTransactionIds`.
 *
 * @param transactionMeta - The candidate child transaction.
 * @param transactions - All known transactions.
 */
export const isMoneyAccountChildTx = (
  transactionMeta: TransactionMeta,
  transactions: TransactionMeta[],
): boolean =>
  transactions.some(
    (tx) =>
      tx.requiredTransactionIds?.includes(transactionMeta.id) &&
      isMoneyAccountTx(tx),
  );

/**
 * Perps/Predict deposit parent types (money → service). When funded from the
 * Money account these are paid with mUSD via MetaMask Pay; the on-chain deposit
 * is signed from the user's EOA on the service chain (Arbitrum/Polygon).
 */
export const PERPS_PREDICT_DEPOSIT_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.perpsDepositAndOrder,
  TransactionType.predictDeposit,
  TransactionType.predictDepositAndOrder,
];

/**
 * Perps/Predict withdraw types (service → money). When the destination is the
 * Money account these arrive as mUSD on Monad. The withdraw is wrapped in an
 * EIP-7702 `batch`, so the type sits in `nestedTransactions`.
 */
export const PERPS_PREDICT_WITHDRAW_TYPES: TransactionType[] = [
  TransactionType.perpsWithdraw,
  TransactionType.predictWithdraw,
];

/**
 * The Perps/Predict deposit or withdraw type for a tx, unwrapping an EIP-7702
 * `batch` whose money-moving call sits in `nestedTransactions`.
 *
 * @param transactionMeta - Transaction metadata.
 */
const effectiveServiceType = (
  transactionMeta: TransactionMeta,
): TransactionType | undefined => {
  const serviceTypes = [
    ...PERPS_PREDICT_DEPOSIT_TYPES,
    ...PERPS_PREDICT_WITHDRAW_TYPES,
  ];
  if (
    transactionMeta.type &&
    serviceTypes.includes(transactionMeta.type as TransactionType)
  ) {
    return transactionMeta.type as TransactionType;
  }
  return transactionMeta.nestedTransactions?.find(
    (nested) => nested.type && serviceTypes.includes(nested.type),
  )?.type;
};

/**
 * True when the `metamaskPay` token is mUSD on the Money account chain (Monad).
 * For a deposit this is the source the Money account paid; for a withdraw
 * (`isPostQuote`) it's the destination — either way it links the tx to the
 * Money account.
 *
 * @param transactionMeta - Transaction metadata.
 */
const isMusdMoneyPayToken = (transactionMeta: TransactionMeta): boolean =>
  isMusdOnMoneyAccountChain(
    transactionMeta.metamaskPay?.tokenAddress,
    transactionMeta.metamaskPay?.chainId as Hex | undefined,
  );

/**
 * Perps/Predict deposit funded from the Money account — from the perspective
 * of the money account this is a 'Send'. The tx `from` is the user's EOA, not
 * the Money account, so it's matched via the mUSD pay token rather than the
 * address.
 *
 * @param transactionMeta - Transaction metadata.
 */
export const isPerpsPredictMoneyDeposit = (
  transactionMeta: TransactionMeta,
): boolean => {
  const type = effectiveServiceType(transactionMeta);
  return (
    Boolean(type) &&
    PERPS_PREDICT_DEPOSIT_TYPES.includes(type as TransactionType) &&
    isMusdMoneyPayToken(transactionMeta)
  );
};

/**
 * Perps/Predict withdraw landing in the Money account — an inflow
 * ("Deposited").
 *
 * @param transactionMeta - Transaction metadata.
 */
export const isPerpsPredictMoneyWithdraw = (
  transactionMeta: TransactionMeta,
): boolean => {
  const type = effectiveServiceType(transactionMeta);
  return (
    Boolean(type) &&
    PERPS_PREDICT_WITHDRAW_TYPES.includes(type as TransactionType) &&
    isMusdMoneyPayToken(transactionMeta)
  );
};

export const isPerpsPredictMoneyActivity = (
  transactionMeta: TransactionMeta,
): boolean =>
  isPerpsPredictMoneyDeposit(transactionMeta) ||
  isPerpsPredictMoneyWithdraw(transactionMeta);
