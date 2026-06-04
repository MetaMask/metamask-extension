import type { CaipChainId } from '@metamask/utils';
import { getTokenMetadataFromKnownToken } from '../../../shared/lib/activity/adapters/helpers';
import { toAssetId } from '../../../shared/lib/asset-utils';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import {
  MUSD_DECIMALS,
  MUSD_TOKEN_ADDRESS,
} from '../../components/app/musd/constants';
import {
  decodeMerklClaimParams,
  getClaimPayoutFromReceipt,
} from '../../hooks/musd/transaction-amount-utils';

type TransferInformation = {
  amount?: string | number;
};

type TransactionReceipt = {
  logs?: Parameters<typeof getClaimPayoutFromReceipt>[0];
};

/**
 * Resolve a Merkl mUSD claim payout amount for activity rows.
 *
 * @param options - Transaction fields used to derive the payout.
 * @param options.data - `txParams.data` hex string.
 * @param options.from - Claiming account address.
 * @param options.transferInformation - Parsed transfer information from the tx meta.
 * @param options.txReceipt - Transaction receipt including event logs.
 * @returns Raw token amount in base units, or undefined when unavailable.
 */
export function resolveMusdClaimAmount({
  data,
  from,
  transferInformation,
  txReceipt,
}: {
  data?: string;
  from?: string;
  transferInformation?: TransferInformation;
  txReceipt?: TransactionReceipt;
}): string | undefined {
  if (
    transferInformation?.amount !== undefined &&
    transferInformation.amount !== null
  ) {
    return String(transferInformation.amount);
  }

  const claimParams = decodeMerklClaimParams(data);
  const userAddress = claimParams?.userAddress ?? from;

  const receiptAmount = getClaimPayoutFromReceipt(txReceipt?.logs, userAddress);

  if (receiptAmount) {
    return receiptAmount;
  }

  return claimParams?.totalAmount;
}

/**
 * Builds the mUSD claim token payload for local activity list items.
 *
 * @param options - Transaction group fields for the claim.
 * @param options.chainId - CAIP-2 chain id for the claim transaction.
 * @param options.initialTransaction - Initial transaction in the group.
 * @param options.primaryTransaction - Primary transaction in the group.
 * @returns Token amount used by activity list rows.
 */
export function buildMusdClaimActivityToken({
  chainId,
  initialTransaction,
  primaryTransaction,
}: {
  chainId: CaipChainId;
  initialTransaction: TransactionGroup['initialTransaction'];
  primaryTransaction: TransactionGroup['primaryTransaction'];
}): TokenAmount {
  const rewardTokenAddress =
    decodeMerklClaimParams(initialTransaction.txParams?.data)?.tokenAddress ??
    MUSD_TOKEN_ADDRESS;
  const claimAmount = resolveMusdClaimAmount({
    data: initialTransaction.txParams?.data,
    from: initialTransaction.txParams.from,
    transferInformation:
      initialTransaction.transferInformation ??
      primaryTransaction.transferInformation,
    txReceipt: primaryTransaction.txReceipt ?? initialTransaction.txReceipt,
  });
  const assetId = toAssetId(rewardTokenAddress, chainId);
  const knownMetadata = getTokenMetadataFromKnownToken(
    rewardTokenAddress,
    'in',
    chainId,
  );

  return {
    direction: 'in',
    symbol: 'mUSD',
    decimals: MUSD_DECIMALS,
    ...(assetId ? { assetId } : {}),
    ...(knownMetadata ?? {}),
    ...(claimAmount ? { amount: claimAmount } : {}),
  };
}

/**
 * Adds mUSD claim token metadata to local claimMusdBonus activity items.
 * API-indexed claims already include `data.token` from the EVM adapter.
 *
 * @param activity - Activity item from `mapLocalTransaction`.
 * @param transactionGroup - Source local transaction group.
 * @returns Activity item with `data.token` when applicable.
 */
export function enrichLocalMusdClaimActivity(
  activity: ActivityListItem,
  transactionGroup: TransactionGroup,
): ActivityListItem {
  if (
    activity.type !== 'claimMusdBonus' ||
    activity.raw?.type !== 'localTransaction'
  ) {
    return activity;
  }

  return {
    ...activity,
    data: {
      ...activity.data,
      token: buildMusdClaimActivityToken({
        chainId: activity.chainId,
        initialTransaction: transactionGroup.initialTransaction,
        primaryTransaction: transactionGroup.primaryTransaction,
      }),
    },
  };
}
