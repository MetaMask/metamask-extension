import { type TransactionMeta } from '@metamask/transaction-controller';
import {
  isMusdOnMoneyAccountChain,
  isMusdToken,
  MUSD_DECIMALS,
  MUSD_TOKEN,
} from '@metamask/money-account-utils';
import type { IconName as IconNameType } from '@metamask/design-system-react';
import { IconName } from '@metamask/design-system-react';
import BigNumber from 'bignumber.js';
import { moneyFormatUsd } from '../../../helpers/money/format';
import { getMoneyAccountDepositAmount } from '../../../helpers/money/money-account-amounts';
import { shortenAddress } from '../../../helpers/utils/util';
import type { MoneyActivityTransactionMeta } from '../constants/mock-activity-data';
import type { AccountsApiActivity } from '../types/money-activity';
import { decodeErc20Transfer } from './erc20-transfer';
import { ERC20_TRANSFER_TYPES } from './money-activity-filters';
import {
  classifyMoneyActivity,
  getMoneyActivityStatus,
  isIncomingMoneyActivityKind,
  moneyActivityKindToIcon,
  moneyActivityLabelKey,
  type MoneyActivityKind,
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
  icon: IconNameType;
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

function prettifyFiatProvider(
  provider: string | undefined,
): string | undefined {
  if (!provider) {
    return undefined;
  }
  const base = provider.split('-')[0];
  if (!base) {
    return undefined;
  }
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function deriveSubtitle(
  tx: TransactionMeta,
  t: MoneyActivityTranslate,
  sourceTokenSymbol: string | undefined,
): string | undefined {
  const explicitSubtitle = getMoneySubtitle(tx);
  if (explicitSubtitle) {
    return explicitSubtitle;
  }

  const kind = classifyMoneyActivity(tx);
  switch (kind) {
    case 'converted':
      return sourceTokenSymbol
        ? `${sourceTokenSymbol} → ${MUSD_DISPLAY_SYMBOL}`
        : undefined;
    case 'sent':
      return sourceTokenSymbol && sourceTokenSymbol !== MUSD_DISPLAY_SYMBOL
        ? `${MUSD_DISPLAY_SYMBOL} → ${sourceTokenSymbol}`
        : MUSD_DISPLAY_SYMBOL;
    case 'received':
      return tx.txParams?.from
        ? t('moneyActivityReceivedFrom', [shortenAddress(tx.txParams.from)])
        : undefined;
    case 'deposited':
      return (
        prettifyFiatProvider(tx.metamaskPay?.fiat?.provider) ??
        sourceTokenSymbol
      );
    default:
      return sourceTokenSymbol;
  }
}

type ResolvedMusdTransferMeta = {
  amount: string;
  decimals: number;
};

/**
 * Resolves mUSD transfer metadata from `transferInformation` or decoded
 * ERC-20 calldata, including nested withdraw transfers.
 *
 * @param tx - Transaction to inspect.
 * @returns Raw amount and decimals when the row is mUSD on a Money chain.
 */
export function resolveMusdTransferMeta(
  tx: TransactionMeta,
): ResolvedMusdTransferMeta | undefined {
  const { transferInformation } = tx;
  let amount = transferInformation?.amount;
  let decimals = transferInformation?.decimals;
  let contractAddress = transferInformation?.contractAddress;

  const isErc20TransferType =
    tx.type !== undefined && ERC20_TRANSFER_TYPES.includes(tx.type);

  if (
    (!amount || decimals === undefined || !contractAddress) &&
    isErc20TransferType &&
    isMusdOnMoneyAccountChain(tx.txParams?.to, tx.chainId)
  ) {
    amount = amount ?? decodeErc20Transfer(tx.txParams?.data, tx.type)?.amount;
    decimals = decimals ?? MUSD_DECIMALS;
    contractAddress = contractAddress ?? tx.txParams?.to;
  }

  if (!amount || decimals === undefined || !contractAddress) {
    const nestedMusdTransfer = tx.nestedTransactions?.find(
      (nested) =>
        nested.type !== undefined &&
        ERC20_TRANSFER_TYPES.includes(nested.type) &&
        isMusdOnMoneyAccountChain(nested.to, tx.chainId),
    );
    if (nestedMusdTransfer) {
      amount =
        amount ??
        decodeErc20Transfer(nestedMusdTransfer.data, nestedMusdTransfer.type)
          ?.amount;
      decimals = decimals ?? MUSD_DECIMALS;
      contractAddress = contractAddress ?? nestedMusdTransfer.to;
    }
  }

  if (!amount || decimals === undefined || !contractAddress) {
    return undefined;
  }
  if (!isMusdOnMoneyAccountChain(contractAddress, tx.chainId)) {
    return undefined;
  }
  return { amount, decimals };
}

function toHumanMusdAmount(
  amountRaw: string,
  decimals: number,
): BigNumber | undefined {
  const parsed = new BigNumber(amountRaw).dividedBy(
    new BigNumber(10).pow(decimals),
  );
  if (parsed.isNaN() || !parsed.isFinite()) {
    return undefined;
  }
  return parsed;
}

function getPayFiatAmount(tx: TransactionMeta): BigNumber | undefined {
  const rawFiat = Number(
    tx.metamaskPay?.targetFiat ?? tx.metamaskPay?.totalFiat,
  );
  if (Number.isNaN(rawFiat) || rawFiat <= 0) {
    return undefined;
  }
  return new BigNumber(rawFiat);
}

function getTransferInformationAmount(
  tx: TransactionMeta,
): BigNumber | undefined {
  const amount = tx.transferInformation?.amount;
  const decimals = tx.transferInformation?.decimals;
  if (amount === undefined || decimals === undefined) {
    return undefined;
  }
  return toHumanMusdAmount(amount, decimals);
}

/**
 * Resolves the human mUSD amount for an on-chain Money activity row.
 * Prefers transfer metadata, then decoded ERC-20 calldata, then deposit
 * `requiredAssets` / nested approve amount, then Pay fiat.
 *
 * @param tx - Transaction to inspect.
 * @returns Human-unit amount, or undefined when none can be resolved.
 */
export function resolveOnchainAmount(
  tx: TransactionMeta,
): BigNumber | undefined {
  const transferAmount = getTransferInformationAmount(tx);
  if (transferAmount) {
    return transferAmount;
  }

  const transferMeta = resolveMusdTransferMeta(tx);
  if (transferMeta) {
    return toHumanMusdAmount(transferMeta.amount, transferMeta.decimals);
  }

  const depositAmount = getMoneyAccountDepositAmount(tx);
  if (depositAmount) {
    const human = toHumanMusdAmount(depositAmount, MUSD_DECIMALS);
    if (human && human.abs().gte('0.01')) {
      return human;
    }
  }

  return getPayFiatAmount(tx);
}

/**
 * Pay-token symbol used in conversion/send/deposit subtitles. Canonicalises
 * registered mUSD to the branded display symbol.
 *
 * @param tokenAddress - MetaMask Pay token address, when present.
 * @param registeredSymbol - ERC-20 symbol from token state.
 * @param nativeTicker - Native ticker when the pay token is the chain native.
 * @returns Display symbol, or undefined when none can be resolved.
 */
export function resolvePayTokenSymbol(
  tokenAddress: string | undefined,
  registeredSymbol: string | undefined,
  nativeTicker: string | undefined,
): string | undefined {
  if (isMusdToken(tokenAddress)) {
    return MUSD_TOKEN.symbol;
  }
  return registeredSymbol ?? nativeTicker;
}

/**
 * Derives display strings for a Money activity row backed by
 * {@link TransactionMeta}.
 *
 * @param tx - The transaction to present.
 * @param t - i18n translate function.
 * @param sourceTokenSymbol - Pay-token symbol for conversion/send/deposit
 * subtitles.
 * @returns Label, subtitle, amounts, icon, and status for the row.
 */
export function getMoneyActivityDisplayInfo(
  tx: TransactionMeta,
  t: MoneyActivityTranslate,
  sourceTokenSymbol?: string,
): MoneyTransactionDisplayInfo {
  const kind = classifyMoneyActivity(tx);
  const status = getMoneyActivityStatus(tx);
  const isIncoming = isIncomingMoneyActivityKind(kind);

  let primaryAmount = '';
  let fiatAmount = '';

  if (status === 'failed') {
    primaryAmount = formatMusdAmount(new BigNumber(0), isIncoming);
    fiatAmount = formatFiatAmount(new BigNumber(0), isIncoming);
  } else {
    const amount = resolveOnchainAmount(tx);
    if (amount !== undefined) {
      primaryAmount = formatMusdAmount(amount, isIncoming);
      fiatAmount = formatFiatAmount(amount, isIncoming);
    }
  }

  return {
    label: t(moneyActivityLabelKey(kind, status)),
    description: deriveSubtitle(tx, t, sourceTokenSymbol),
    primaryAmount,
    fiatAmount,
    isIncoming,
    icon: moneyActivityKindToIcon(kind),
    status,
  };
}

const ACCOUNTS_API_LABEL_KEY: Record<AccountsApiActivity['kind'], string> = {
  card: 'moneyActivityPurchase',
  cashback: 'moneyActivityMusdBack',
  refund: 'moneyActivityRefund',
};

/**
 * Display strings for an Accounts API card/cashback/refund row.
 *
 * @param activity - Parsed Accounts API settlement.
 * @param t - i18n translate function.
 * @returns Label, Card subtitle, signed amounts, and confirmed status.
 */
export function getAccountsApiActivityDisplayInfo(
  activity: AccountsApiActivity,
  t: MoneyActivityTranslate,
): MoneyTransactionDisplayInfo {
  const isIncoming = activity.kind === 'cashback' || activity.kind === 'refund';
  const usdValue = new BigNumber(activity.amount).dividedBy(
    new BigNumber(10).pow(activity.token.decimals),
  );

  return {
    label: t(ACCOUNTS_API_LABEL_KEY[activity.kind]),
    description: t('moneyActivityCard'),
    primaryAmount: formatMusdAmount(usdValue, isIncoming),
    fiatAmount: formatFiatAmount(usdValue, isIncoming),
    isIncoming,
    icon: IconName.Card,
    status: 'confirmed',
  };
}

export type { MoneyActivityKind };
