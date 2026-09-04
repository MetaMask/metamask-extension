import type { TransactionMeta } from '@metamask/transaction-controller';
import BigNumber from 'bignumber.js';
import { moneyFormatUsd } from '../../../helpers/money/format';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';
import { isValidTransactionHash } from '../../../../shared/lib/transactions.utils';
import type { MoneyActivityTransactionMeta } from '../constants/mock-activity-data';
import {
  classifyMoneyActivity,
  getMoneyActivityStatus,
  isIncomingMoneyActivityKind,
} from './classify-money-activity';

export type MoneyTransactionDetailsHeroAmount = {
  amount: string;
  isSuccessColor: boolean;
};

function getTransferAmount(tx: TransactionMeta): BigNumber | undefined {
  const amount = tx.transferInformation?.amount;
  const decimals = tx.transferInformation?.decimals;
  if (amount === undefined || decimals === undefined) {
    return undefined;
  }

  const parsed = new BigNumber(amount).dividedBy(
    new BigNumber(10).pow(decimals),
  );
  if (parsed.isNaN() || !parsed.isFinite()) {
    return undefined;
  }
  return parsed;
}

/**
 * Formats the details-page hero amount. Failed rows keep the attempted
 * amount (unsigned); confirmed/pending rows keep the signed fiat prefix.
 *
 * @param tx - The transaction to present.
 * @returns Formatted fiat amount and whether to use the success color.
 */
export function getMoneyTransactionDetailsHeroAmount(
  tx: TransactionMeta,
): MoneyTransactionDetailsHeroAmount {
  const kind = classifyMoneyActivity(tx);
  const status = getMoneyActivityStatus(tx);
  const isIncoming = isIncomingMoneyActivityKind(kind);
  const transferAmount = getTransferAmount(tx) ?? new BigNumber(0);
  const formatted = moneyFormatUsd(transferAmount);

  if (status === 'failed') {
    return { amount: formatted, isSuccessColor: false };
  }

  return {
    amount: `${isIncoming ? '+' : '-'}${formatted}`,
    isSuccessColor: isIncoming,
  };
}

/**
 * Formats a timestamp as "July 9, 2025 at 10:56 AM".
 *
 * @param timeMs - Unix epoch milliseconds.
 * @returns Localized date and time.
 */
export function formatMoneyActivityDetailsDate(timeMs: number): string {
  const date = new Date(timeMs);
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Shortens a hex string for display (address or transaction hash).
 *
 * @param value - The full hex value.
 * @returns A truncated representation.
 */
export function shortenMoneyActivityHex(value: string): string {
  if (value.length <= 11) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

/**
 * Payment method / source shown on deposit details as "Paid with".
 *
 * @param tx - The transaction to present.
 * @returns The subtitle for deposit rows, otherwise undefined.
 */
export function getMoneyActivityPaidWith(
  tx: TransactionMeta,
): string | undefined {
  if (classifyMoneyActivity(tx) !== 'deposited') {
    return undefined;
  }
  return (tx as MoneyActivityTransactionMeta).moneySubtitle;
}

/**
 * Reads a human-readable error message from transaction metadata.
 *
 * @param tx - The transaction to present.
 * @returns The error message, or undefined when none is present.
 */
export function getMoneyActivityErrorMessage(
  tx: TransactionMeta,
): string | undefined {
  const message = tx.error?.message;
  if (typeof message !== 'string' || message.trim() === '') {
    return undefined;
  }
  return message;
}

/**
 * Builds a block-explorer URL for an on-chain Money activity transaction.
 *
 * @param chainId - Hex chain id from {@link TransactionMeta}.
 * @param txHash - Transaction hash, when mined.
 * @returns The explorer URL, or undefined when hash or explorer is missing.
 */
export function getMoneyActivityExplorerUrl(
  chainId: string,
  txHash: string | undefined,
): string | undefined {
  if (!txHash || !isValidTransactionHash(txHash)) {
    return undefined;
  }

  const explorerRoot = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId];
  if (!explorerRoot) {
    return undefined;
  }

  return `${explorerRoot.replace(/\/$/u, '')}/tx/${txHash}`;
}
