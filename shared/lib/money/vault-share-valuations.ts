import type {
  VaultShareValuation,
  VaultShareValuationsResponse,
} from '@metamask/money-account-api-data-service';
import { hexToNumber, type Hex } from '@metamask/utils';
import { isEqualCaseInsensitive } from '../string-utils';

const AMOUNT_PATTERN = /^\d+$/u;
const TX_HASH_PATTERN = /^0x[0-9a-f]{64}$/iu;

export type VaultShareToken = {
  chainId: Hex;
  address: Hex;
};

export type CachedVaultShareValuation = {
  type: 'transfer_in' | 'transfer_out';
  logIndex?: number;
  blockNumber: number;
  sharesWei: string;
  assetsWei: string;
  assetDecimals: number;
};

export type VaultShareValuationCacheKey = {
  account: string;
  chainId: number;
  vaultAddress: string;
  txHash: string;
};

export type VaultShareValuationCacheEntry = {
  valuations: CachedVaultShareValuation[];
} & VaultShareValuationCacheKey;

export function getVaultShareValuationCacheIdentity(
  key: VaultShareValuationCacheKey,
): string {
  return [
    key.account.toLowerCase(),
    key.chainId,
    key.vaultAddress.toLowerCase(),
    key.txHash.toLowerCase(),
  ].join(':');
}

export function entriesByIdentity(
  entries: readonly VaultShareValuationCacheEntry[],
): Map<string, VaultShareValuationCacheEntry> {
  return new Map(
    entries.map((entry) => [getVaultShareValuationCacheIdentity(entry), entry]),
  );
}

export function getVaultShareVaultKey(
  chainId: Hex,
  vaultAddress: string,
): string {
  return `${chainId.toLowerCase()}:${vaultAddress.toLowerCase()}`;
}

export function toCachedVaultShareValuation(
  valuation: VaultShareValuation,
): CachedVaultShareValuation | undefined {
  if (
    valuation.asset_symbol !== 'mUSD' ||
    (valuation.type !== 'transfer_in' && valuation.type !== 'transfer_out') ||
    typeof valuation.block_number !== 'number' ||
    !Number.isInteger(valuation.block_number) ||
    valuation.block_number < 0 ||
    !Number.isInteger(valuation.asset_decimals) ||
    valuation.asset_decimals < 0 ||
    typeof valuation.shares_wei !== 'string' ||
    !AMOUNT_PATTERN.test(valuation.shares_wei) ||
    !AMOUNT_PATTERN.test(valuation.assets_wei)
  ) {
    return undefined;
  }

  const logIndex =
    typeof valuation.log_index === 'number' &&
    Number.isInteger(valuation.log_index) &&
    valuation.log_index >= 0
      ? valuation.log_index
      : undefined;

  return {
    type: valuation.type,
    ...(logIndex === undefined ? {} : { logIndex }),
    blockNumber: valuation.block_number,
    sharesWei: valuation.shares_wei,
    assetsWei: valuation.assets_wei,
    assetDecimals: valuation.asset_decimals,
  };
}

export function cacheEntriesFromResponse({
  response,
  account,
  chainId,
  vaultAddresses,
}: {
  response: VaultShareValuationsResponse;
  account: string;
  chainId: Hex;
  vaultAddresses: readonly Hex[];
}): VaultShareValuationCacheEntry[] {
  const numericChainId = hexToNumber(chainId);
  if (response.chain_id !== numericChainId) {
    return [];
  }

  const entries = new Map<string, VaultShareValuationCacheEntry>();

  for (const result of response.results) {
    if (!result.found || !TX_HASH_PATTERN.test(result.tx_hash)) {
      continue;
    }

    for (const valuation of result.valuations) {
      const cached = toCachedVaultShareValuation(valuation);
      const vaultAddress = vaultAddresses.find((address) =>
        isEqualCaseInsensitive(address, valuation.vault_address),
      );
      if (!cached || !vaultAddress) {
        continue;
      }

      const key: VaultShareValuationCacheKey = {
        account: account.toLowerCase(),
        chainId: numericChainId,
        vaultAddress: vaultAddress.toLowerCase(),
        txHash: result.tx_hash.toLowerCase(),
      };
      const identity = getVaultShareValuationCacheIdentity(key);
      const entry = entries.get(identity) ?? { ...key, valuations: [] };
      entry.valuations.push(cached);
      entries.set(identity, entry);
    }
  }

  return [...entries.values()];
}
