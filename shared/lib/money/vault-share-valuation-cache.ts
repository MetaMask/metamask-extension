import {
  array,
  define,
  enums,
  is,
  literal,
  number,
  string,
  type,
} from '@metamask/superstruct';
import { getStorageItem, setStorageItem } from '../storage-helpers';
import {
  entriesByIdentity,
  type VaultShareValuationCacheEntry,
} from './vault-share-valuations';

const CACHE_VERSION = 1;
const CACHE_KEY = `money.activity.vault-share-valuations.v${CACHE_VERSION}`;
export const VAULT_SHARE_VALUATION_CACHE_LIMIT = 500;

const DigitsStruct = define<string>(
  'digits',
  (value) => typeof value === 'string' && /^\d+$/u.test(value),
);

const CachedValuationStruct = type({
  type: enums(['transfer_in', 'transfer_out']),
  blockNumber: number(),
  sharesWei: DigitsStruct,
  assetsWei: DigitsStruct,
  assetDecimals: number(),
});

const CachedEntryStruct = type({
  account: string(),
  chainId: number(),
  vaultAddress: string(),
  txHash: string(),
  valuations: array(CachedValuationStruct),
});

const CacheDocumentStruct = type({
  version: literal(CACHE_VERSION),
  entries: array(CachedEntryStruct),
});

export async function readCachedVaultShareValuations(): Promise<
  VaultShareValuationCacheEntry[]
> {
  const parsed = await getStorageItem<unknown>(CACHE_KEY);
  return is(parsed, CacheDocumentStruct) ? parsed.entries : [];
}

function latestBlockNumber(entry: VaultShareValuationCacheEntry): number {
  return entry.valuations.reduce(
    (latest, valuation) => Math.max(latest, valuation.blockNumber),
    0,
  );
}

function mergeEntries(
  current: readonly VaultShareValuationCacheEntry[],
  incoming: readonly VaultShareValuationCacheEntry[],
): VaultShareValuationCacheEntry[] {
  return [...entriesByIdentity([...current, ...incoming]).values()]
    .sort((left, right) => latestBlockNumber(right) - latestBlockNumber(left))
    .slice(0, VAULT_SHARE_VALUATION_CACHE_LIMIT);
}

let writeQueue = Promise.resolve();

export function writeCachedVaultShareValuations(
  entries: readonly VaultShareValuationCacheEntry[],
): Promise<void> {
  const write = writeQueue
    .then(async () => {
      const current = await readCachedVaultShareValuations();
      await setStorageItem(CACHE_KEY, {
        version: CACHE_VERSION,
        entries: mergeEntries(current, entries),
      });
    })
    .catch(() => undefined);
  writeQueue = write;
  return write;
}
