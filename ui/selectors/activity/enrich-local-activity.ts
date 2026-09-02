import {
  MUSD_DECIMALS,
  MUSD_TOKEN,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
} from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import { getTokenMetadataFromKnownToken } from '../../../shared/lib/activity/adapters/helpers';
import { toAssetId } from '../../../shared/lib/asset-utils';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import {
  parseApprovalTransactionData,
  parseStandardTokenTransactionData,
} from '../../../shared/lib/transaction.utils';
import { hasTransactionType } from '../../../shared/lib/transactions.utils';
import { getMoneyAccountWithdrawTransferDetails } from '../../pages/confirmations/utils/money-account-withdraw';
import { enrichLocalMusdClaimActivity } from './enrich-local-musd-claim';

const TOKEN_TRANSFER_TYPES = new Set<TransactionType>([
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
]);

type LocalActivitySource = TransactionGroup & {
  contractTokenMetadata?: { symbol?: string; decimals?: number };
};

type TransferInformation = NonNullable<
  LocalActivitySource['initialTransaction']['transferInformation']
>;

function resolveTransferAmount(
  transferInformation: TransferInformation | undefined,
  parsedAmount: unknown,
): string | undefined {
  if (
    transferInformation?.amount !== undefined &&
    transferInformation.amount !== null
  ) {
    return String(transferInformation.amount);
  }
  if (parsedAmount !== undefined && parsedAmount !== null) {
    return String(parsedAmount);
  }
  return undefined;
}

/**
 * Whether known-token metadata should be consulted for logo/symbol/decimals.
 *
 * Intentionally applies to any known bridge token (not only Monad USDC) when
 * symbol, decimals, or assetId is missing from transfer info, watched tokens,
 * or the existing activity token.
 * @param transferInformation
 * @param contractTokenMetadata
 * @param token
 */
function shouldLookupKnownTokenMetadata(
  transferInformation: TransferInformation | undefined,
  contractTokenMetadata: LocalActivitySource['contractTokenMetadata'],
  token: TokenAmount | undefined,
): boolean {
  const missingSymbol =
    !transferInformation?.symbol &&
    !contractTokenMetadata?.symbol &&
    !token?.symbol;
  const missingDecimals =
    transferInformation?.decimals === undefined &&
    contractTokenMetadata?.decimals === undefined &&
    token?.decimals === undefined;
  return missingSymbol || missingDecimals || !token?.assetId;
}

function enrichTokenTransferActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  if (activity.type !== 'send') {
    return activity;
  }

  const { type, txParams, transferInformation } =
    transactionGroup.initialTransaction;
  const data = txParams?.data;

  if (!type || !TOKEN_TRANSFER_TYPES.has(type) || !data) {
    return activity;
  }

  const transactionData = parseStandardTokenTransactionData(data);
  const recipient = transactionData?.args?._to ?? transactionData?.args?.to;
  const parsedAmount =
    transactionData?.args?._value ?? transactionData?.args?.value;
  const amount = resolveTransferAmount(transferInformation, parsedAmount);
  // Known-token metadata supplies logo (assetId), symbol, and decimals when
  // watched-token / transferInformation sources are incomplete. Amount and
  // recipient still come from transferInformation or calldata parsing above.
  const contractAddress = transferInformation?.contractAddress ?? txParams?.to;
  const activityToken =
    'token' in activity.data ? activity.data.token : undefined;

  const knownTokenMetadata = shouldLookupKnownTokenMetadata(
    transferInformation,
    transactionGroup.contractTokenMetadata,
    activityToken,
  )
    ? getTokenMetadataFromKnownToken(
        contractAddress,
        'out',
        transactionGroup.initialTransaction.chainId,
      )
    : undefined;
  const symbol =
    transferInformation?.symbol ??
    transactionGroup.contractTokenMetadata?.symbol ??
    knownTokenMetadata?.symbol ??
    activityToken?.symbol;
  const decimals =
    transferInformation?.decimals ??
    transactionGroup.contractTokenMetadata?.decimals ??
    knownTokenMetadata?.decimals ??
    activityToken?.decimals;
  const assetId = activityToken?.assetId ?? knownTokenMetadata?.assetId;

  const nextTo =
    typeof recipient === 'string' && recipient !== activity.data.to
      ? recipient
      : activity.data.to;

  if (
    nextTo === activity.data.to &&
    amount === activityToken?.amount &&
    symbol === activityToken?.symbol &&
    decimals === activityToken?.decimals &&
    assetId === activityToken?.assetId
  ) {
    return activity;
  }

  return {
    ...activity,
    data: {
      ...activity.data,
      to: nextTo,
      token: {
        direction: activityToken?.direction ?? 'out',
        ...(assetId ? { assetId } : {}),
        ...(symbol ? { symbol } : {}),
        ...(decimals === undefined ? {} : { decimals }),
        ...(amount ? { amount } : {}),
      },
    },
  };
}

function enrichApprovalActivity(
  activity: ActivityListItem,
  transactionGroup: TransactionGroup,
): ActivityListItem {
  if (activity.type !== 'approveSpendingCap') {
    return activity;
  }

  const data = transactionGroup.initialTransaction.txParams?.data;
  if (!data) {
    return activity;
  }

  const approveData = parseApprovalTransactionData(data as `0x${string}`);
  const approveAmount = approveData?.amountOrTokenId?.toFixed(0);

  if (approveAmount !== '0') {
    return activity;
  }

  return {
    ...activity,
    type: 'revokeSpendingCap',
  };
}

function enrichMoneyAccountWithdrawActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  const transaction = transactionGroup.initialTransaction;
  if (
    !hasTransactionType(transaction, [TransactionType.moneyAccountWithdraw])
  ) {
    return activity;
  }

  const transfer = transaction.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodTransfer,
  );
  const { recipient, amountRaw: amount } =
    getMoneyAccountWithdrawTransferDetails(transaction);
  if (typeof recipient !== 'string') {
    return activity;
  }

  const tokenAddress = transfer?.to;
  const { chainId } = transaction;
  const assetId =
    (chainId ? MUSD_TOKEN_ASSET_ID_BY_CHAIN[chainId] : undefined) ??
    (tokenAddress && chainId
      ? toAssetId(
          tokenAddress,
          toCaipChainId(
            KnownCaipNamespace.Eip155,
            Number.parseInt(chainId, 16).toString(),
          ),
        )
      : undefined);

  return {
    ...activity,
    type: 'send',
    data: {
      from: transaction.txParams?.from ?? '',
      to: recipient,
      token: {
        direction: 'out',
        symbol: MUSD_TOKEN.symbol,
        decimals: MUSD_DECIMALS,
        ...(amount ? { amount } : {}),
        ...(assetId ? { assetId } : {}),
      },
    },
  };
}

export function enrichLocalActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  let next = activity;
  next = enrichMoneyAccountWithdrawActivity(next, transactionGroup);
  next = enrichTokenTransferActivity(next, transactionGroup);
  next = enrichApprovalActivity(next, transactionGroup);
  next = enrichLocalMusdClaimActivity(next, transactionGroup);
  return next;
}
