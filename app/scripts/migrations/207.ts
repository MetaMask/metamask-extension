import { hasProperty, isObject } from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { Migrate } from './types';

export const version = 207;

// ─── Types ─────────────────────────────────────────────────────────────────────

type AssetType = 'erc20' | 'spl' | 'native';

type AssetInfo = {
  type: AssetType;
  symbol: string;
  name: string;
  decimals: number;
  image?: string;
  aggregators?: string[];
};

type AssetsControllerShape = {
  assetsInfo: Record<string, AssetInfo>;
  assetsBalance: Record<string, Record<string, { amount: string }>>;
  customAssets: Record<string, string[]>;
};

function defaultAssetsController() {
  return {
    assetsInfo: {},
    assetsBalance: {},
    assetsPrice: {},
    customAssets: {},
    assetPreferences: {},
    selectedCurrency: 'usd',
  };
}

/**
 * Consolidate EVM token state (TokensController + TokenBalancesController)
 * and non-EVM asset state (MultichainAssetsController + MultichainBalancesController)
 * into the unified AssetsController state.
 *
 * Classification rule (per account/asset):
 * - Non-zero balance  → assetsBalance  (tracked automatically)
 * - Zero / missing    → customAssets   (user-added, must be polled)
 *
 * Metadata is written to the global `assetsInfo` registry (keyed by CAIP-19,
 * not by account) so the asset is immediately renderable in the UI — even for
 * tokens belonging to accounts that aren't in AccountsController.
 *
 * Idempotency: existing AssetsController entries are never overwritten; the
 * migration only fills gaps.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - Set used to record which controllers were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const { data } = versionedData;
  const addressToId = buildAddressToIdMap(data);
  const ac = ensureAssetsController(data);

  const evmChanged = migrateEvmTokens(data, ac, addressToId);
  const nonEvmChanged = migrateNonEvmAssets(data, ac);

  if (evmChanged || nonEvmChanged) {
    changedControllers.add('AssetsController');
  }
}) satisfies Migrate;

// ─── State setup ───────────────────────────────────────────────────────────────

/**
 * Ensure `data.AssetsController` exists with the expected sub-shapes that the
 * migration writes into. Returns a typed view of the controller.
 *
 * @param data - The migration data root.
 */
function ensureAssetsController(
  data: Record<string, unknown>,
): AssetsControllerShape {
  if (
    !hasProperty(data, 'AssetsController') ||
    !isObject(data.AssetsController)
  ) {
    data.AssetsController = defaultAssetsController();
  }

  const ac = data.AssetsController as Record<string, unknown>;

  if (!isObject(ac.assetsInfo)) {
    ac.assetsInfo = {};
  }
  if (!isObject(ac.assetsBalance)) {
    ac.assetsBalance = {};
  }
  if (!isObject(ac.customAssets)) {
    ac.customAssets = {};
  }

  return ac as unknown as AssetsControllerShape;
}

/**
 * Build a map from lowercase account address to account UUID using
 * AccountsController.internalAccounts.accounts.
 *
 * @param data - The migration data root.
 */
function buildAddressToIdMap(
  data: Record<string, unknown>,
): Record<string, string> {
  const accounts = readPath(data, [
    'AccountsController',
    'internalAccounts',
    'accounts',
  ]);

  if (!isObject(accounts)) {
    return {};
  }

  const map: Record<string, string> = {};
  for (const [id, account] of Object.entries(accounts)) {
    if (
      isObject(account) &&
      typeof account.address === 'string' &&
      account.address
    ) {
      map[account.address.toLowerCase()] = id;
    }
  }
  return map;
}

// ─── CAIP-19 / encoding helpers ────────────────────────────────────────────────

/**
 * Convert a hex chain ID (e.g. '0x1') to a CAIP-2 chain ID (e.g. 'eip155:1').
 * Returns null when the input cannot be parsed.
 *
 * @param hexChainId - The hex-encoded EVM chain ID.
 */
function hexChainIdToCaip2(hexChainId: string): string | null {
  const decimal = parseInt(hexChainId, 16);
  if (!Number.isFinite(decimal)) {
    return null;
  }
  return `eip155:${decimal}`;
}

/**
 * Build the CAIP-19 asset ID for an ERC-20 token.
 * Returns null when the chain ID or address cannot be parsed.
 *
 * @param hexChainId - The hex-encoded EVM chain ID.
 * @param tokenAddress - The ERC-20 contract address.
 */
function buildErc20AssetId(
  hexChainId: string,
  tokenAddress: string,
): string | null {
  const caip2 = hexChainIdToCaip2(hexChainId);
  if (!caip2) {
    return null;
  }
  const checksummed = toChecksumHexAddress(tokenAddress);
  if (!checksummed) {
    return null;
  }
  return `${caip2}/erc20:${checksummed}`;
}

/**
 * Convert a hex balance string (e.g. '0x5f5e100') to a decimal string
 * (e.g. '100000000'). Returns '0' when the input cannot be parsed.
 *
 * @param hex - The hex-encoded balance.
 */
function hexBalanceToDecimal(hex: string): string {
  try {
    return BigInt(hex).toString();
  } catch {
    return '0';
  }
}

/**
 * Returns true when `hexBalance` represents a strictly positive integer.
 *
 * @param hexBalance - Candidate hex balance string.
 */
function isNonZeroHexBalance(hexBalance: unknown): hexBalance is string {
  if (typeof hexBalance !== 'string') {
    return false;
  }
  try {
    return BigInt(hexBalance) > 0n;
  } catch {
    return false;
  }
}

/**
 * Returns true when `amount` (a decimal string, possibly fractional) represents
 * a strictly positive value. Negative and non-finite values are rejected.
 *
 * @param amount - Candidate decimal amount string.
 */
function isNonZeroAmount(amount: unknown): amount is string {
  if (typeof amount !== 'string') {
    return false;
  }
  const n = parseFloat(amount);
  return Number.isFinite(n) && n > 0;
}

/**
 * Derive the AssetsController token type from a CAIP-19 asset namespace.
 *
 * Mappings: erc20 → 'erc20', spl → 'spl', slip44 → 'native'.
 * Unknown or malformed inputs default to 'spl' (safe default for non-EVM
 * snap assets, which are the only producers of unknown namespaces here).
 *
 * @param assetId - CAIP-19 asset identifier.
 */
function assetTypeFromCaip19(assetId: string): AssetType {
  const slashIdx = assetId.indexOf('/');
  if (slashIdx === -1) {
    return 'spl';
  }
  const namespace = assetId.slice(slashIdx + 1).split(':', 1)[0];
  switch (namespace) {
    case 'erc20':
      return 'erc20';
    case 'slip44':
      return 'native';
    case 'spl':
    default:
      return 'spl';
  }
}

// ─── Generic write helpers ─────────────────────────────────────────────────────

/**
 * Read a nested path on an object, returning `undefined` if any intermediate
 * key is missing or not an object.
 *
 * @param root - The object to read from.
 * @param path - Sequence of keys to traverse.
 */
function readPath(root: unknown, path: string[]): unknown {
  let cursor: unknown = root;
  for (const key of path) {
    if (!isObject(cursor) || !hasProperty(cursor, key)) {
      return undefined;
    }
    cursor = cursor[key];
  }
  return cursor;
}

/**
 * Write `info` to `ac.assetsInfo[assetId]` only if the entry is missing.
 * Returns true when a write occurred.
 *
 * @param ac - The AssetsController view.
 * @param assetId - CAIP-19 asset identifier.
 * @param info - Metadata to write.
 */
function writeAssetInfoIfAbsent(
  ac: AssetsControllerShape,
  assetId: string,
  info: AssetInfo,
): boolean {
  if (ac.assetsInfo[assetId]) {
    return false;
  }
  ac.assetsInfo[assetId] = info;
  return true;
}

/**
 * Classify a per-account asset entry as either tracked (non-zero balance) or
 * custom (zero / missing balance), respecting existing entries.
 *
 * Mutual exclusion: if the asset is already in `assetsBalance` for this
 * account, we never duplicate it into `customAssets`, and vice versa.
 *
 * @param ac - The AssetsController view.
 * @param accountId - The account UUID.
 * @param assetId - CAIP-19 asset identifier.
 * @param amount - The decimal balance (already classified as non-zero) or null.
 */
function classifyAccountAsset(
  ac: AssetsControllerShape,
  accountId: string,
  assetId: string,
  amount: string | null,
): boolean {
  const alreadyTracked = Boolean(ac.assetsBalance[accountId]?.[assetId]);
  const alreadyCustom = ac.customAssets[accountId]?.includes(assetId) ?? false;

  if (amount !== null) {
    if (alreadyTracked) {
      return false;
    }
    ac.assetsBalance[accountId] ??= {};
    ac.assetsBalance[accountId][assetId] = { amount };
    return true;
  }

  if (alreadyTracked || alreadyCustom) {
    return false;
  }
  ac.customAssets[accountId] ??= [];
  ac.customAssets[accountId].push(assetId);
  return true;
}

// ─── EVM migration ─────────────────────────────────────────────────────────────

type EvmTokenBalances = Record<string, Record<string, Record<string, string>>>;

/**
 * Read TokenBalancesController.tokenBalances or `{}` when absent / malformed.
 *
 * Shape: tokenBalances[accountAddressLowercase][chainIdHex][tokenAddressChecksummed] = hexBalance
 *
 * @param data - The migration data root.
 */
function readEvmTokenBalances(data: Record<string, unknown>): EvmTokenBalances {
  const balances = readPath(data, ['TokenBalancesController', 'tokenBalances']);
  return isObject(balances) ? (balances as EvmTokenBalances) : {};
}

/**
 * Build an `AssetInfo` from a raw TokensController token entry.
 *
 * @param token - Raw token object.
 */
function buildEvmAssetInfo(token: Record<string, unknown>): AssetInfo {
  const symbol = typeof token.symbol === 'string' ? token.symbol : '';
  const name =
    typeof token.name === 'string' && token.name ? token.name : symbol;

  const info: AssetInfo = {
    type: 'erc20',
    symbol,
    name,
    decimals: typeof token.decimals === 'number' ? token.decimals : 0,
  };
  if (typeof token.image === 'string' && token.image) {
    info.image = token.image;
  }
  if (Array.isArray(token.aggregators)) {
    info.aggregators = token.aggregators;
  }
  return info;
}

/**
 * Migrate EVM tokens from TokensController + TokenBalancesController.
 *
 * @param data - The migration data root.
 * @param ac - The AssetsController view.
 * @param addressToId - Lowercase address → account UUID map.
 */
function migrateEvmTokens(
  data: Record<string, unknown>,
  ac: AssetsControllerShape,
  addressToId: Record<string, string>,
): boolean {
  const allTokens = readPath(data, ['TokensController', 'allTokens']);
  if (!isObject(allTokens)) {
    return false;
  }

  const tokenBalances = readEvmTokenBalances(data);
  let changed = false;

  for (const [hexChainId, accountTokens] of Object.entries(allTokens)) {
    if (!isObject(accountTokens)) {
      continue;
    }

    for (const [rawAddress, tokens] of Object.entries(accountTokens)) {
      if (!Array.isArray(tokens)) {
        continue;
      }

      const accountAddress = rawAddress.toLowerCase();
      const accountId = addressToId[accountAddress];
      const chainBalances =
        (isObject(tokenBalances[accountAddress]) &&
          (tokenBalances[accountAddress][hexChainId] as
            | Record<string, string>
            | undefined)) ||
        {};

      for (const token of tokens) {
        if (
          !isObject(token) ||
          typeof token.address !== 'string' ||
          !token.address
        ) {
          continue;
        }
        // Skip NFTs — AssetsController tracks them separately
        if (token.isERC721 === true) {
          continue;
        }

        const assetId = buildErc20AssetId(hexChainId, token.address);
        if (!assetId) {
          continue;
        }

        // assetsInfo is a global registry; write regardless of accountId presence.
        if (writeAssetInfoIfAbsent(ac, assetId, buildEvmAssetInfo(token))) {
          changed = true;
        }

        // Per-account tracking requires a known account UUID.
        if (!accountId) {
          continue;
        }

        const checksummed = toChecksumHexAddress(token.address);
        const hexBalance = chainBalances[checksummed];
        const amount = isNonZeroHexBalance(hexBalance)
          ? hexBalanceToDecimal(hexBalance)
          : null;

        if (classifyAccountAsset(ac, accountId, assetId, amount)) {
          changed = true;
        }
      }
    }
  }

  return changed;
}

// ─── Non-EVM migration ─────────────────────────────────────────────────────────

type SnapBalances = Record<
  string,
  Record<string, { amount: string; unit: string }>
>;

/**
 * Read MultichainBalancesController.balances or `{}` when absent / malformed.
 *
 * @param data - The migration data root.
 */
function readSnapBalances(data: Record<string, unknown>): SnapBalances {
  const balances = readPath(data, ['MultichainBalancesController', 'balances']);
  return isObject(balances) ? (balances as SnapBalances) : {};
}

/**
 * Build an `AssetInfo` from a snaps-sdk FungibleAssetMetadata entry, or
 * return null when the metadata is missing / non-fungible.
 *
 * @param assetId - CAIP-19 asset identifier.
 * @param snapMeta - Raw snap metadata entry.
 */
function buildNonEvmAssetInfo(
  assetId: string,
  snapMeta: unknown,
): AssetInfo | null {
  if (!isObject(snapMeta) || snapMeta.fungible !== true) {
    return null;
  }

  const units = Array.isArray(snapMeta.units) ? snapMeta.units : [];
  const primaryUnit = isObject(units[0]) ? units[0] : null;

  let symbol = '';
  if (typeof snapMeta.symbol === 'string') {
    symbol = snapMeta.symbol;
  } else if (primaryUnit && typeof primaryUnit.symbol === 'string') {
    symbol = primaryUnit.symbol;
  }

  const info: AssetInfo = {
    type: assetTypeFromCaip19(assetId),
    symbol,
    name: typeof snapMeta.name === 'string' ? snapMeta.name : '',
    decimals:
      primaryUnit && typeof primaryUnit.decimals === 'number'
        ? primaryUnit.decimals
        : 0,
  };
  if (typeof snapMeta.iconUrl === 'string' && snapMeta.iconUrl) {
    info.image = snapMeta.iconUrl;
  }
  return info;
}

/**
 * Migrate non-EVM assets from MultichainAssetsController +
 * MultichainBalancesController.
 *
 * @param data - The migration data root.
 * @param ac - The AssetsController view.
 */
function migrateNonEvmAssets(
  data: Record<string, unknown>,
  ac: AssetsControllerShape,
): boolean {
  const accountsAssets = readPath(data, [
    'MultichainAssetsController',
    'accountsAssets',
  ]);
  if (!isObject(accountsAssets)) {
    return false;
  }

  const snapsMetadata = readPath(data, [
    'MultichainAssetsController',
    'assetsMetadata',
  ]);
  const metadata = isObject(snapsMetadata) ? snapsMetadata : {};
  const balances = readSnapBalances(data);

  let changed = false;

  for (const [accountId, assetIds] of Object.entries(accountsAssets)) {
    if (!Array.isArray(assetIds)) {
      continue;
    }

    const accountBalances = isObject(balances[accountId])
      ? balances[accountId]
      : {};

    for (const assetId of assetIds) {
      if (typeof assetId !== 'string' || !assetId) {
        continue;
      }

      const info = buildNonEvmAssetInfo(assetId, metadata[assetId]);
      if (info && writeAssetInfoIfAbsent(ac, assetId, info)) {
        changed = true;
      }

      const balanceEntry = accountBalances[assetId];
      const rawAmount =
        isObject(balanceEntry) && typeof balanceEntry.amount === 'string'
          ? balanceEntry.amount
          : undefined;
      const amount = isNonZeroAmount(rawAmount) ? rawAmount : null;

      if (classifyAccountAsset(ac, accountId, assetId, amount)) {
        changed = true;
      }
    }
  }

  return changed;
}
