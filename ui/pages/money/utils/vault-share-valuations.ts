import BigNumber from 'bignumber.js';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import { hexToNumber } from '@metamask/utils';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';
import {
  getVaultShareValuationCacheIdentity,
  getVaultShareVaultKey,
  type CachedVaultShareValuation,
  type VaultShareToken,
  type VaultShareValuationCacheKey,
} from '../../../../shared/lib/money/vault-share-valuations';
import type {
  AccountsApiActivity,
  AccountsApiDisplayAmount,
} from '../types/money-activity';

export type VaultShareValuationTarget = {
  activity: Extract<AccountsApiActivity, { kind: 'card' | 'cashback' }>;
  vaultKey: string;
  key?: VaultShareValuationCacheKey;
  identity?: string;
};

export function getVaultShareValuationTarget({
  activity,
  moneyAddress,
  vaultShareTokens,
}: {
  activity: AccountsApiActivity;
  moneyAddress: string;
  vaultShareTokens: readonly VaultShareToken[];
}): VaultShareValuationTarget | undefined {
  if (activity.kind !== 'card' && activity.kind !== 'cashback') {
    return undefined;
  }

  const token = vaultShareTokens.find(
    (candidate) =>
      candidate.chainId.toLowerCase() === activity.chainId.toLowerCase() &&
      isEqualCaseInsensitive(candidate.address, activity.token.address),
  );
  if (!token) {
    return undefined;
  }

  const vaultKey = getVaultShareVaultKey(token.chainId, token.address);
  if (activity.blockNumber === undefined) {
    return { activity, vaultKey };
  }

  const key: VaultShareValuationCacheKey = {
    account: moneyAddress.toLowerCase(),
    chainId: hexToNumber(activity.chainId),
    vaultAddress: activity.token.address.toLowerCase(),
    txHash: activity.hash.toLowerCase(),
  };
  return {
    activity,
    vaultKey,
    key,
    identity: getVaultShareValuationCacheIdentity(key),
  };
}

export function getHistoricalVaultShareDisplayAmount(
  activity: AccountsApiActivity,
  cachedValuations: readonly CachedVaultShareValuation[] | undefined,
): AccountsApiDisplayAmount | undefined {
  if (
    !cachedValuations ||
    (activity.kind !== 'card' && activity.kind !== 'cashback') ||
    activity.blockNumber === undefined
  ) {
    return undefined;
  }

  const expectedType =
    activity.kind === 'card' ? 'transfer_out' : 'transfer_in';
  const matches = cachedValuations.filter(
    (valuation) =>
      valuation.type === expectedType &&
      valuation.blockNumber === activity.blockNumber &&
      valuation.sharesWei === activity.amount &&
      Number.isInteger(valuation.assetDecimals) &&
      valuation.assetDecimals >= 0,
  );

  if (matches.length !== 1) {
    return undefined;
  }

  return {
    type: 'historical' as const,
    value: matches[0].assetsWei,
    decimals: matches[0].assetDecimals,
  };
}

const SHARES_PATTERN = /^\d+$/u;
const RATE_PATTERN = /^\d+(?:\.\d+)?$/u;

export function getApproximateVaultShareDisplayAmount(
  activity: AccountsApiActivity,
  rate: string | undefined,
): AccountsApiDisplayAmount {
  if (
    !rate ||
    !RATE_PATTERN.test(rate) ||
    !SHARES_PATTERN.test(activity.amount)
  ) {
    return { type: 'unavailable' as const };
  }

  const shares = new BigNumber(activity.amount);
  const currentRate = new BigNumber(rate);
  if (
    !shares.isFinite() ||
    !shares.isInteger() ||
    shares.comparedTo(0) < 0 ||
    !currentRate.isFinite() ||
    currentRate.comparedTo(0) < 0
  ) {
    return { type: 'unavailable' as const };
  }

  const value = shares
    .dividedBy(new BigNumber(10).pow(activity.token.decimals))
    .times(currentRate)
    .times(new BigNumber(10).pow(MUSD_DECIMALS))
    .floor()
    .toFixed(0);

  return {
    type: 'approximate' as const,
    value,
    decimals: MUSD_DECIMALS,
  };
}
