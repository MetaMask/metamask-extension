import { toChecksumHexAddress } from '@metamask/controller-utils';
import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 208;

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

const ZERO_AMOUNT = '0';
const EVM_ASSET_PREFIX = 'eip155:';

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
 * Consolidate user-imported token state (ERC-20 from TokensController,
 * SPL/non-native from MultichainAssetsController) into the unified
 * `AssetsController` state.
 *
 * What gets migrated:
 * Only user-imported tokens — EVM ERC-20s and non-EVM non-native (e.g. SPL)
 * tokens. Native assets (CAIP-19 `slip44` namespace) are deliberately skipped:
 * the `AssetsController` builds those at runtime via its own seeding logic
 * (`#ensureDefaultTrackedAssetsSeeded` and the snap-discovery flow), so the
 * migration does not need to populate them.
 *
 * Which accounts are migrated:
 * Per-account writes happen only for "relevant" accounts — the currently
 * selected account, plus any account that has at least one imported ERC-20
 * (TokensController) or non-native multichain asset (MultichainAssetsController).
 * Accounts that exist in storage but were never opened by the user (no imported
 * tokens, not selected) are skipped — the controller rebuilds their state at
 * runtime. Accounts holding only native assets are likewise skipped.
 *
 * Per-account classification:
 * ERC-20 with non-zero balance lands in `assetsBalance`. ERC-20 with zero or
 * missing balance lands in `customAssets`. Non-EVM non-native tokens (e.g. SPL)
 * always land in `assetsBalance` with `'0'` for missing balances — the snap
 * manages discovery for these, so they are never user-imported in the
 * `customAssets` sense.
 *
 * Metadata is written to the global `assetsInfo` registry (keyed by CAIP-19),
 * so each migrated asset is immediately renderable in the UI.
 *
 * Idempotency: existing AssetsController entries are never overwritten; the
 * migration only fills gaps. Non-EVM and native entries previously written to
 * `customAssets` by an earlier buggy version are cleaned up.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - Set used to record which controllers were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  try {
    const { data } = versionedData;
    const ac = ensureAssetsController(data);
    const addressToId = buildAddressToIdMap(data);
    const relevantAccountIds = collectRelevantAccountIds(data, addressToId);

    const evmChanged = migrateEvmTokens(
      data,
      ac,
      addressToId,
      relevantAccountIds,
    );
    const nonEvmChanged = migrateNonEvmAssets(data, ac, relevantAccountIds);
    const cleanupChanged = cleanupCustomAssets(ac);

    if (evmChanged || nonEvmChanged || cleanupChanged) {
      changedControllers.add('AssetsController');
    }
  } catch (error) {
    captureException(
      new Error(
        `Migration #${version} - migrate old AssetsControllers state to new unified AssetsController state failed: ${getErrorMessage(error)}`,
      ),
    );
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
 * `AccountsController.internalAccounts.accounts`.
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

/**
 * Collect the account UUIDs that should be migrated. An account is "relevant"
 * when any of the following holds: it is the currently selected account
 * (`AccountsController.internalAccounts.selectedAccount`); or it has at least
 * one imported ERC-20 token in `TokensController.allTokens`; or it has at
 * least one imported non-native multichain asset in
 * `MultichainAssetsController.accountsAssets` (entries with the `slip44`
 * namespace are ignored, since native assets are built at runtime).
 *
 * Returning an empty set means there is nothing worth migrating per-account
 * (e.g. a fresh install). Per-account writes should be skipped in that case.
 *
 * @param data - The migration data root.
 * @param addressToId - Lowercase address → account UUID map.
 */
function collectRelevantAccountIds(
  data: Record<string, unknown>,
  addressToId: Record<string, string>,
): Set<string> {
  const ids = new Set<string>();

  // 1. Selected account — always relevant.
  const selectedAccountId = readPath(data, [
    'AccountsController',
    'internalAccounts',
    'selectedAccount',
  ]);
  if (typeof selectedAccountId === 'string' && selectedAccountId) {
    ids.add(selectedAccountId);
  }

  // 2. EVM accounts with at least one imported ERC-20 token.
  const allTokens = readPath(data, ['TokensController', 'allTokens']);
  if (isObject(allTokens)) {
    for (const accountTokens of Object.values(allTokens)) {
      if (!isObject(accountTokens)) {
        continue;
      }
      for (const [rawAddress, tokens] of Object.entries(accountTokens)) {
        if (!Array.isArray(tokens) || tokens.length === 0) {
          continue;
        }
        const accountId = addressToId[rawAddress.toLowerCase()];
        if (accountId) {
          ids.add(accountId);
        }
      }
    }
  }

  // 3. Non-EVM accounts with at least one non-native imported asset.
  const accountsAssets = readPath(data, [
    'MultichainAssetsController',
    'accountsAssets',
  ]);
  if (isObject(accountsAssets)) {
    for (const [accountId, assetIds] of Object.entries(accountsAssets)) {
      if (!Array.isArray(assetIds)) {
        continue;
      }
      const hasNonNative = assetIds.some(
        (assetId) => typeof assetId === 'string' && !isNativeAssetId(assetId),
      );
      if (hasNonNative) {
        ids.add(accountId);
      }
    }
  }

  return ids;
}

// ─── CAIP-19 / encoding helpers ────────────────────────────────────────────────

/**
 * Convert a hex chain ID (e.g. '0x1') to a CAIP-2 chain ID (e.g. 'eip155:1').
 * Returns null when the input cannot be parsed.
 *
 * @param hexChainId - The hex-encoded EVM chain ID.
 */
function hexChainIdToCaip2(hexChainId: string): string | null {
  const decimal = Number.parseInt(hexChainId, 16);
  if (!Number.isFinite(decimal)) {
    return null;
  }
  return `${EVM_ASSET_PREFIX}${decimal}`;
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
 * Convert a hex balance string into the decimal-applied display string the
 * unified `AssetsController` stores in `assetsBalance[accountId][assetId].amount`
 * (e.g. '2.029194191379609600' for 18-decimal DAI). Returns '0' on parse error.
 *
 * @param hex - The hex-encoded raw balance (smallest unit).
 * @param decimals - The token's decimal precision.
 */
function hexBalanceToDisplayAmount(hex: string, decimals: number): string {
  try {
    const bn = new BigNumber(hex, 16);
    if (bn.isNaN()) {
      return ZERO_AMOUNT;
    }
    const safeDecimals = Math.max(decimals, 0);
    const divisor = new BigNumber(10).pow(safeDecimals);
    return bn.dividedBy(divisor).toFixed(safeDecimals);
  } catch {
    return ZERO_AMOUNT;
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
  const n = Number.parseFloat(amount);
  return Number.isFinite(n) && n > 0;
}

/**
 * Derive the AssetsController token type from a CAIP-19 asset namespace.
 *
 * Mappings: erc20 → 'erc20', spl → 'spl', slip44 → 'native'.
 * Unknown / malformed inputs default to 'spl' (safe default for non-EVM
 * snap assets, the only producer of unknown namespaces here).
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

/**
 * Returns true when the assetId belongs to a non-EVM chain (i.e. anything not
 * prefixed with `eip155:`).
 *
 * @param assetId - CAIP-19 asset identifier.
 */
function isNonEvmAssetId(assetId: string): boolean {
  return !assetId.startsWith(EVM_ASSET_PREFIX);
}

/**
 * Returns true when the assetId represents a native asset (CAIP-19 `slip44`
 * namespace). The unified `AssetsController` builds native asset entries at
 * runtime, so the migration deliberately skips them.
 *
 * @param assetId - CAIP-19 asset identifier.
 */
function isNativeAssetId(assetId: string): boolean {
  return assetTypeFromCaip19(assetId) === 'native';
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
 * Write a per-account balance entry, preserving any pre-existing entry. If the
 * asset was previously stored in `customAssets`, remove it from there to keep
 * the two maps mutually exclusive.
 *
 * @param ac - The AssetsController view.
 * @param accountId - The account UUID.
 * @param assetId - CAIP-19 asset identifier.
 * @param amount - Decimal amount string.
 */
function writeAssetBalance(
  ac: AssetsControllerShape,
  accountId: string,
  assetId: string,
  amount: string,
): boolean {
  ac.assetsBalance[accountId] ??= {};
  if (ac.assetsBalance[accountId][assetId]) {
    return false;
  }
  ac.assetsBalance[accountId][assetId] = { amount };
  removeFromCustomAssets(ac, accountId, assetId);
  return true;
}

/**
 * Add `assetId` to `customAssets[accountId]` if it's not already tracked in
 * `assetsBalance` or already present in `customAssets`.
 *
 * @param ac - The AssetsController view.
 * @param accountId - The account UUID.
 * @param assetId - CAIP-19 asset identifier.
 */
function addCustomAsset(
  ac: AssetsControllerShape,
  accountId: string,
  assetId: string,
): boolean {
  if (ac.assetsBalance[accountId]?.[assetId]) {
    return false;
  }
  ac.customAssets[accountId] ??= [];
  if (ac.customAssets[accountId].includes(assetId)) {
    return false;
  }
  ac.customAssets[accountId].push(assetId);
  return true;
}

/**
 * Remove an asset ID from `customAssets[accountId]` if present.
 *
 * @param ac - The AssetsController view.
 * @param accountId - The account UUID.
 * @param assetId - CAIP-19 asset identifier.
 */
function removeFromCustomAssets(
  ac: AssetsControllerShape,
  accountId: string,
  assetId: string,
): void {
  const list = ac.customAssets[accountId];
  if (!list) {
    return;
  }
  const idx = list.indexOf(assetId);
  if (idx >= 0) {
    list.splice(idx, 1);
  }
}

/**
 * Strip entries from `customAssets` that should not be there:
 * - Non-EVM (snap-discovered) assets — always tracked, never user-imported.
 * - Native assets (slip44) — populated by the controller at runtime.
 *
 * These may have been added by an earlier buggy version of this migration.
 *
 * @param ac - The AssetsController view.
 */
function cleanupCustomAssets(ac: AssetsControllerShape): boolean {
  let changed = false;
  for (const [accountId, assetIds] of Object.entries(ac.customAssets)) {
    if (!Array.isArray(assetIds)) {
      continue;
    }
    const filtered = assetIds.filter(
      (id) => !isNonEvmAssetId(id) && !isNativeAssetId(id),
    );
    if (filtered.length !== assetIds.length) {
      ac.customAssets[accountId] = filtered;
      changed = true;
    }
  }
  return changed;
}

// ─── EVM migration ─────────────────────────────────────────────────────────────

type EvmTokenBalances = Record<string, Record<string, Record<string, string>>>;

/**
 * Read `TokenBalancesController.tokenBalances` or `{}` when absent / malformed.
 *
 * Shape: balances[accountAddressLowercase][chainIdHex][tokenAddressChecksummed] = hexBalance
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
 * @param relevantAccountIds - Set of account UUIDs eligible for per-account writes.
 */
function migrateEvmTokens(
  data: Record<string, unknown>,
  ac: AssetsControllerShape,
  addressToId: Record<string, string>,
  relevantAccountIds: Set<string>,
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
      const accountIsRelevant =
        Boolean(accountId) && relevantAccountIds.has(accountId);

      const chainBalances =
        (isObject(tokenBalances[accountAddress]) &&
          tokenBalances[accountAddress][hexChainId]) ||
        {};

      for (const token of tokens) {
        if (
          !isObject(token) ||
          typeof token.address !== 'string' ||
          !token.address
        ) {
          continue;
        }
        // Skip NFTs — AssetsController tracks them separately.
        if (token.isERC721 === true) {
          continue;
        }

        const assetId = buildErc20AssetId(hexChainId, token.address);
        if (!assetId) {
          continue;
        }

        // assetsInfo is a global registry; write regardless of accountId.
        if (writeAssetInfoIfAbsent(ac, assetId, buildEvmAssetInfo(token))) {
          changed = true;
        }

        // Per-account writes are restricted to relevant accounts.
        if (!accountIsRelevant) {
          continue;
        }

        const checksummed = toChecksumHexAddress(token.address);
        const hexBalance = chainBalances[checksummed];
        const decimals =
          typeof token.decimals === 'number' ? token.decimals : 0;

        if (isNonZeroHexBalance(hexBalance)) {
          const amount = hexBalanceToDisplayAmount(hexBalance, decimals);
          if (writeAssetBalance(ac, accountId, assetId, amount)) {
            changed = true;
          }
        } else if (addCustomAsset(ac, accountId, assetId)) {
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
 * Read `MultichainBalancesController.balances` or `{}` when absent / malformed.
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
 * Non-EVM non-native assets are snap-discovered and always tracked: they are
 * written to `assetsBalance` (with `'0'` for missing/zero balance) and never
 * to `customAssets`. Native (slip44) assets are skipped — the controller
 * builds them at runtime.
 *
 * Per-account writes are restricted to relevant accounts (selected, or with
 * imported tokens) so we don't pollute state with assets for accounts the
 * user has never opened.
 *
 * @param data - The migration data root.
 * @param ac - The AssetsController view.
 * @param relevantAccountIds - Set of account UUIDs eligible for per-account writes.
 */
function migrateNonEvmAssets(
  data: Record<string, unknown>,
  ac: AssetsControllerShape,
  relevantAccountIds: Set<string>,
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

    const accountIsRelevant = relevantAccountIds.has(accountId);
    const accountBalances = isObject(balances[accountId])
      ? balances[accountId]
      : {};

    for (const assetId of assetIds) {
      if (typeof assetId !== 'string' || !assetId) {
        continue;
      }
      // Native assets (slip44) are populated by the controller at runtime.
      if (isNativeAssetId(assetId)) {
        continue;
      }

      // Global metadata write — unaffected by per-account relevance.
      const info = buildNonEvmAssetInfo(assetId, metadata[assetId]);
      if (info && writeAssetInfoIfAbsent(ac, assetId, info)) {
        changed = true;
      }

      if (!accountIsRelevant) {
        continue;
      }

      const balanceEntry = accountBalances[assetId];
      const rawAmount =
        isObject(balanceEntry) && typeof balanceEntry.amount === 'string'
          ? balanceEntry.amount
          : undefined;
      const amount = isNonZeroAmount(rawAmount) ? rawAmount : ZERO_AMOUNT;

      if (writeAssetBalance(ac, accountId, assetId, amount)) {
        changed = true;
      }
    }
  }

  return changed;
}
