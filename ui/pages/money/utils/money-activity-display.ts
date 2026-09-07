import type { TransactionMeta } from '@metamask/transaction-controller';
import type { IconName } from '@metamask/design-system-react';
import BigNumber from 'bignumber.js';
import { moneyFormatUsd } from '../../../helpers/money/format';
import type { MoneyActivityTransactionMeta } from '../constants/mock-activity-data';
import {
  classifyMoneyActivity,
  getMoneyActivityStatus,
  isIncomingMoneyActivityKind,
  moneyActivityKindToIcon,
  moneyActivityLabelKey,
  type MoneyActivityStatus,
} from './classify-money-activity';

export const MUSD_DISPLAY_SYMBOL = 'mUSD';

export type MoneyActivityTranslate = (key: string, args?: string[]) => string;

export type MoneyTransactionDisplayInfo = {
  label: string;
  description: string | undefined;
  primaryAmount: string;
  fiatAmount: string;
  isIncoming: boolean;
  icon: IconName;
  status: MoneyActivityStatus;
};

const musdAmountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

function formatMusdAmount(amount: BigNumber, isIncoming: boolean): string {
  return `${isIncoming ? '+' : '-'}${musdAmountFormatter.format(
    amount.toNumber(),
  )} ${MUSD_DISPLAY_SYMBOL}`;
}

function formatFiatAmount(amount: BigNumber, isIncoming: boolean): string {
  return `${isIncoming ? '+' : '-'}${moneyFormatUsd(amount)}`;
}

function getMoneySubtitle(tx: TransactionMeta): string | undefined {
  return (tx as MoneyActivityTransactionMeta).moneySubtitle;
}

function shortenAddress(address: string): string {
  if (address.length <= 11) {
    return address;
  }
  return `${address.slice(0, 7)}...${address.slice(-5)}`;
}

function deriveSubtitle(
  tx: TransactionMeta,
  t: MoneyActivityTranslate,
): string | undefined {
  const explicitSubtitle = getMoneySubtitle(tx);
  if (explicitSubtitle) {
    return explicitSubtitle;
  }

  const kind = classifyMoneyActivity(tx);
  if (kind === 'received' && tx.txParams?.from) {
    return t('moneyActivityReceivedFrom', [shortenAddress(tx.txParams.from)]);
  }

  return undefined;
}

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
 * Derives display strings for a Money activity row backed by
 * {@link TransactionMeta}. Tuned for mock fixtures (explicit subtitle and
 * title key, `transferInformation` amounts). Live market-rate paths are
 * omitted until TransactionController wiring lands.
 *
 * @param tx - The transaction to present.
 * @param t - i18n translate function.
 * @returns Label, subtitle, amounts, icon, and status for the row.
 */
export function getMoneyActivityDisplayInfo(
  tx: TransactionMeta,
  t: MoneyActivityTranslate,
): MoneyTransactionDisplayInfo {
  const kind = classifyMoneyActivity(tx);
  const status = getMoneyActivityStatus(tx);
  const isIncoming = isIncomingMoneyActivityKind(kind);
  const transferAmount = getTransferAmount(tx);

  let primaryAmount = '';
  let fiatAmount = '';

  if (status === 'failed') {
    primaryAmount = formatMusdAmount(new BigNumber(0), isIncoming);
    fiatAmount = formatFiatAmount(new BigNumber(0), isIncoming);
  } else if (transferAmount !== undefined) {
    primaryAmount = formatMusdAmount(transferAmount, isIncoming);
    fiatAmount = formatFiatAmount(transferAmount, isIncoming);
  }

  return {
    label: t(moneyActivityLabelKey(kind, status)),
    description: deriveSubtitle(tx, t),
    primaryAmount,
    fiatAmount,
    isIncoming,
    icon: moneyActivityKindToIcon(kind),
    status,
  };
}
