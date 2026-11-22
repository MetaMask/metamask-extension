import {
  getErrorMessage,
  hasProperty,
  isObject,
  getChecksumAddress,
  Hex,
} from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 215;

/**
 * Assets Controller Metadata Healing Migration
 * Issue: https://consensyssoftware.atlassian.net/browse/ASSETS-3346
 * Incident: #incident-metamask-1731
 *
 * Background: After a prior defect in AssetsController, metadata for custom tokens were wiped
 * - Most popular chains support auto-detection and can self-heal, however not all.
 *
 * Fix: This migration restores metadata for custom tokens on niche EVM chains (that are unable to auto-detect/self-heal)
 */

type AssetInfo = {
  type: 'erc20';
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
  assetPreferences: Record<string, { hidden?: boolean }>;
};

type RestorableAsset = {
  /** Account UUID owning the token, or undefined if no mapping exists. */
  accountId: string | undefined;
  /** Checksummed CAIP-19 asset ID (e.g. 'eip155:14/erc20:0x…'). */
  assetId: string;
  /** Metadata to write into `assetsInfo` (only used to fill a gap). */
  info: AssetInfo;
};

const EVM_ASSET_PREFIX = 'eip155:';

/**
 * Popular networks (covered by the Accounts API) can self-heal through auto-detection.
 */
const ACCOUNT_API_SUPPORTED_CHAIN_IDS = new Set<string>([
  'eip155:1', // Ethereum Mainnet
  'eip155:10', // Optimism
  'eip155:56', // BNB Smart Chain
  'eip155:137', // Polygon
  'eip155:143', // Monad
  'eip155:999', // HyperEVM
  'eip155:1329', // Sei
  'eip155:5042', // Arc
  'eip155:8453', // Base
  'eip155:42161', // Arbitrum One
  'eip155:43114', // Avalanche
  'eip155:59144', // Linea
]);

/**
 * Heal `AssetsController.assetsInfo` entries that were wiped for tokens on niche
 * EVM chains (chains not covered by the accounts API, e.g. Flare / chainId 14).
 *
 * What the migration does: It will use the old AssetsControllers state (TokensController.allTokens)
 * to restore the metadata for the tokens on niche chains on the new AssetsController state (AssetsController.assetsInfo).
 *
 * What it deliberately skips:
 * - Accounts-API-supported chains — see `ACCOUNT_API_SUPPORTED_CHAIN_IDS`.
 * - Tokens the user hid/removed, detected via either the legacy
 * `TokensController.allIgnoredTokens` or the new `AssetsController.assetPreferences` (`hidden: true`).
 * - Non-EVM assets and ERC-721s.
 *
 * The migration only runs when `AssetsController` state already exists (i.e. the
 * unified assets state is in use); otherwise there is nothing to heal.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedKeys - Set used to record which controllers were modified.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;
  try {
    const { data } = versionedData;

    const ac = getAssetsController(data);
    if (!ac) {
      return;
    }

    // Step 1: gather every token whose metadata is eligible to be healed.
    const restorable = collectRestorableAssets(data, ac);
    if (restorable.length === 0) {
      return;
    }

    // Step 2: heal each one. Writes are idempotent (fill gaps / dedupe), so we
    // can flag the controller changed simply because there is work to do.
    for (const { accountId, assetId, info } of restorable) {
      // `assetsInfo` is a global registry; fill gaps only, never overwrite.
      ac.assetsInfo[assetId] ??= info;

      // Ensure the asset is tracked for its account.
      if (accountId) {
        addCustomAsset(ac, accountId, assetId);
      }
    }

    changedKeys.add('AssetsController');
  } catch (error) {
    captureException(
      new Error(
        `Migration #${version} - heal wiped AssetsController metadata for niche-chain tokens failed: ${getErrorMessage(error)}`,
      ),
    );
  }
}) satisfies Migrate;

// ─── Collection (Step 1) ─────────────────────────────────────────────────────

/**
 * Walk the legacy `TokensController.allTokens` and return a flat list of tokens
 * whose `AssetsController` metadata is eligible to be healed.
 *
 * Everything that must be left alone is filtered out here: unparseable or
 * accounts-API-supported chains, non-EVM/ERC-721 entries, invalid addresses,
 * and tokens the user hid/removed (legacy `allIgnoredTokens` or new
 * `assetPreferences`). Whether an entry already exists in `assetsInfo` /
 * `customAssets` is left to the (idempotent) application step.
 *
 * @param data - The migration data root.
 * @param ac - The AssetsController view.
 */
function collectRestorableAssets(
  data: Record<string, unknown>,
  ac: AssetsControllerShape,
): RestorableAsset[] {
  const allTokens = readPath(data, ['TokensController', 'allTokens']);
  if (!isObject(allTokens)) {
    return [];
  }

  const addressToId = buildAddressToIdMap(data);
  const hiddenAssetIds = collectHiddenAssetIds(ac);
  const allIgnoredTokens = readPath(data, [
    'TokensController',
    'allIgnoredTokens',
  ]);

  const restorable: RestorableAsset[] = [];

  for (const [hexChainId, accountTokens] of Object.entries(allTokens)) {
    if (!isObject(accountTokens)) {
      continue;
    }

    const caip2 = hexChainIdToCaip2(hexChainId);
    // Skip chains we can't parse or that self-heal via the accounts API.
    if (!caip2 || isAccountApiSupportedChain(caip2)) {
      continue;
    }

    for (const [rawAddress, tokens] of Object.entries(accountTokens)) {
      if (!Array.isArray(tokens) || tokens.length === 0) {
        continue;
      }

      const accountId = addressToId[rawAddress.toLowerCase()];
      const ignoredAddresses = collectIgnoredAddresses(
        allIgnoredTokens,
        hexChainId,
        rawAddress,
      );

      for (const token of tokens) {
        const assetId = getRestorableAssetId(
          token,
          caip2,
          ignoredAddresses,
          hiddenAssetIds,
        );
        if (!assetId) {
          continue;
        }

        restorable.push({
          accountId,
          assetId,
          info: buildEvmAssetInfo(token as Record<string, unknown>),
        });
      }
    }
  }

  return restorable;
}

/**
 * Resolve a raw `TokensController` token entry to the CAIP-19 asset ID that
 * should be healed, or `null` when the token must be skipped (not an object,
 * missing/invalid address, an ERC-721, or hidden in either controller).
 *
 * @param token - Raw token entry from `allTokens`.
 * @param caip2 - The CAIP-2 chain ID of the token's chain (e.g. 'eip155:14').
 * @param ignoredAddresses - Lowercase addresses hidden via legacy `allIgnoredTokens`.
 * @param hiddenAssetIds - Lowercase asset IDs hidden via new `assetPreferences`.
 */
function getRestorableAssetId(
  token: unknown,
  caip2: string,
  ignoredAddresses: Set<string>,
  hiddenAssetIds: Set<string>,
): string | null {
  if (!isObject(token) || typeof token.address !== 'string' || !token.address) {
    return null;
  }
  // Skip NFTs — AssetsController tracks them separately.
  if (token.isERC721 === true) {
    return null;
  }

  const assetId = buildErc20AssetId(caip2, token.address as Hex);
  if (!assetId) {
    return null;
  }

  // Skip tokens the user hid/removed — in the legacy controller…
  if (ignoredAddresses.has(token.address.toLowerCase())) {
    return null;
  }
  // …or in the new controller.
  if (hiddenAssetIds.has(assetId.toLowerCase())) {
    return null;
  }

  return assetId;
}

// ─── State setup ───────────────────────────────────────────────────────────────

/**
 * Return a typed view of `data.AssetsController`, ensuring the sub-maps the
 * migration reads/writes exist. Returns `null` when the controller is absent
 * (unified assets state not in use), in which case there is nothing to heal.
 *
 * @param data - The migration data root.
 */
function getAssetsController(
  data: Record<string, unknown>,
): AssetsControllerShape | null {
  if (
    !hasProperty(data, 'AssetsController') ||
    !isObject(data.AssetsController)
  ) {
    return null;
  }

  const ac = data.AssetsController as Record<string, unknown>;
  ensureRecordObject(ac, 'assetsInfo');
  ensureRecordObject(ac, 'assetsBalance');
  ensureRecordObject(ac, 'customAssets');
  ensureRecordObject(ac, 'assetPreferences');

  return ac as unknown as AssetsControllerShape;
}

/**
 * Ensure a controller sub-key is an object map, creating an empty object when
 * absent or invalid.
 *
 * @param container - Parent object containing the map field.
 * @param key - Field name to verify.
 */
function ensureRecordObject(
  container: Record<string, unknown>,
  key: string,
): void {
  if (!isObject(container[key])) {
    container[key] = {};
  }
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

  return Object.entries(accounts).reduce<Record<string, string>>(
    (accumulator, [id, account]) => {
      if (
        isObject(account) &&
        typeof account.address === 'string' &&
        account.address.length > 0
      ) {
        accumulator[account.address.toLowerCase()] = id;
      }
      return accumulator;
    },
    {},
  );
}

/**
 * Collect the set of CAIP-19 asset IDs (lowercased) marked `hidden: true` in
 * `AssetsController.assetPreferences`. Lowercasing lets callers compare against
 * checksummed asset IDs case-insensitively.
 *
 * @param ac - The AssetsController view.
 */
function collectHiddenAssetIds(ac: AssetsControllerShape): Set<string> {
  const hidden = new Set<string>();
  for (const [assetId, preference] of Object.entries(ac.assetPreferences)) {
    if (isObject(preference) && preference.hidden === true) {
      hidden.add(assetId.toLowerCase());
    }
  }
  return hidden;
}

/**
 * Collect the lowercase token addresses ignored (hidden) in the legacy
 * `TokensController.allIgnoredTokens` for a given chain and account. The account
 * key is matched case-insensitively.
 *
 * @param allIgnoredTokens - The legacy `allIgnoredTokens` map (possibly missing).
 * @param hexChainId - The hex chain ID being processed.
 * @param accountAddress - The account address whose ignored list to read.
 */
function collectIgnoredAddresses(
  allIgnoredTokens: unknown,
  hexChainId: string,
  accountAddress: string,
): Set<string> {
  const result = new Set<string>();
  if (!isObject(allIgnoredTokens)) {
    return result;
  }

  const chainEntry = allIgnoredTokens[hexChainId];
  if (!isObject(chainEntry)) {
    return result;
  }

  const lowerAccount = accountAddress.toLowerCase();
  for (const [address, list] of Object.entries(chainEntry)) {
    if (address.toLowerCase() !== lowerAccount || !Array.isArray(list)) {
      continue;
    }
    for (const ignored of list) {
      if (typeof ignored === 'string') {
        result.add(ignored.toLowerCase());
      }
    }
  }
  return result;
}

// ─── CAIP-19 / encoding helpers ────────────────────────────────────────────────

/**
 * Whether a CAIP-2 chain ID belongs to a network supported by the accounts API
 * (per the frozen `ACCOUNT_API_SUPPORTED_CHAIN_IDS` snapshot), whose token
 * metadata self-heals at runtime and therefore must not be touched.
 *
 * @param caip2 - The CAIP-2 chain ID (e.g. 'eip155:14').
 */
function isAccountApiSupportedChain(caip2: string): boolean {
  return ACCOUNT_API_SUPPORTED_CHAIN_IDS.has(caip2.toLowerCase());
}

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
 * Build the checksummed CAIP-19 asset ID for an ERC-20 token. Returns null when
 * the address cannot be parsed.
 *
 * @param caip2 - The CAIP-2 chain ID (e.g. 'eip155:14').
 * @param tokenAddress - The ERC-20 contract address.
 */
function buildErc20AssetId(caip2: string, tokenAddress: Hex): string | null {
  const checksummed = getChecksumAddress(tokenAddress);
  if (!checksummed) {
    return null;
  }
  return `${caip2}/erc20:${checksummed}`;
}

/**
 * Read a nested path on an object, returning `undefined` if any intermediate
 * key is missing or not an object.
 *
 * @param root - The object to read from.
 * @param path - Sequence of keys to traverse.
 */
function readPath(root: unknown, path: string[]): unknown {
  return path.reduce<unknown>((cursor, key) => {
    if (!isObject(cursor) || !hasProperty(cursor, key)) {
      return undefined;
    }
    return cursor[key];
  }, root);
}

/**
 * Build an `AssetInfo` from a raw TokensController token entry.
 *
 * @param token - Raw token object.
 */
function buildEvmAssetInfo(token: Record<string, unknown>): AssetInfo {
  const symbol = typeof token.symbol === 'string' ? token.symbol : '';
  const normalizedName =
    typeof token.name === 'string' && token.name.length > 0
      ? token.name
      : symbol;
  const decimals = typeof token.decimals === 'number' ? token.decimals : 0;

  const image =
    typeof token.image === 'string' && token.image.length > 0
      ? token.image
      : undefined;
  const aggregators = Array.isArray(token.aggregators)
    ? token.aggregators
    : undefined;

  return {
    type: 'erc20',
    symbol,
    name: normalizedName,
    decimals,
    ...(image ? { image } : {}),
    ...(aggregators ? { aggregators } : {}),
  };
}

/**
 * Add `assetId` to `customAssets[accountId]` if it's not already tracked in
 * `assetsBalance` (mutual exclusion) and not already present in `customAssets`.
 * Returns true when a write occurred.
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

  const accountCustomAssets = ac.customAssets[accountId] ?? [];
  if (accountCustomAssets.includes(assetId)) {
    return false;
  }

  ac.customAssets[accountId] = [...accountCustomAssets, assetId];
  return true;
}
