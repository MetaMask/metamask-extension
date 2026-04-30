import { hasProperty, isObject } from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { Migrate } from './types';

export const version = 207;

/**
 * Consolidate EVM token state (TokensController + TokenBalancesController)
 * and non-EVM asset state (MultichainAssetsController + MultichainBalancesController)
 * into the unified AssetsController state.
 *
 * Classification rule:
 * - Token/asset with a non-zero balance  → assetsBalance  (tracked automatically)
 * - Token/asset with no / zero balance   → customAssets   (user-added, must be polled)
 *
 * In both cases the metadata is written to assetsInfo so the asset is
 * immediately renderable in the UI.
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

  // ── 1. Build accountAddress (lowercase) → accountId (UUID) map ─────────────
  const addressToId: Record<string, string> = buildAddressToIdMap(data);

  // ── 2. Ensure AssetsController exists with the expected shape ───────────────
  if (
    !hasProperty(data, 'AssetsController') ||
    !isObject(data.AssetsController)
  ) {
    data.AssetsController = {
      assetsInfo: {},
      assetsBalance: {},
      assetsPrice: {},
      customAssets: {},
      assetPreferences: {},
      selectedCurrency: 'usd',
    };
  }

  const ac = data.AssetsController as {
    assetsInfo: Record<string, unknown>;
    assetsBalance: Record<string, Record<string, { amount: string }>>;
    customAssets: Record<string, string[]>;
  };

  if (!isObject(ac.assetsInfo)) {
    ac.assetsInfo = {};
  }
  if (!isObject(ac.assetsBalance)) {
    ac.assetsBalance = {};
  }
  if (!isObject(ac.customAssets)) {
    ac.customAssets = {};
  }

  let changed = false;

  // ── 3. EVM tokens: TokensController.allTokens ──────────────────────────────
  changed = migrateEvmTokens(data, ac, addressToId) || changed;

  // ── 4. Non-EVM assets: MultichainAssetsController.accountsAssets ───────────
  changed = migrateNonEvmAssets(data, ac) || changed;

  if (changed) {
    changedControllers.add('AssetsController');
  }
}) satisfies Migrate;

// ─── helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a map from lowercase account address to account UUID using
 * AccountsController.internalAccounts.accounts.
 * @param data
 */
function buildAddressToIdMap(
  data: Record<string, unknown>,
): Record<string, string> {
  const map: Record<string, string> = {};

  if (
    !hasProperty(data, 'AccountsController') ||
    !isObject(data.AccountsController) ||
    !hasProperty(data.AccountsController, 'internalAccounts') ||
    !isObject(data.AccountsController.internalAccounts) ||
    !hasProperty(data.AccountsController.internalAccounts, 'accounts') ||
    !isObject(data.AccountsController.internalAccounts.accounts)
  ) {
    return map;
  }

  for (const [id, account] of Object.entries(
    data.AccountsController.internalAccounts.accounts,
  )) {
    if (
      isObject(account) &&
      hasProperty(account, 'address') &&
      typeof account.address === 'string' &&
      account.address
    ) {
      map[account.address.toLowerCase()] = id;
    }
  }

  return map;
}

/**
 * Convert a hex chain ID (e.g. '0x1') to a CAIP-2 chain ID (e.g. 'eip155:1').
 * Returns null when the input cannot be parsed.
 * @param hexChainId
 */
function hexChainIdToCaip2(hexChainId: string): string | null {
  try {
    const decimal = parseInt(hexChainId, 16);
    if (!Number.isFinite(decimal)) {
      return null;
    }
    return `eip155:${decimal}`;
  } catch {
    return null;
  }
}

/**
 * Build the CAIP-19 asset ID for an ERC-20 token.
 * Returns null when the chain ID cannot be parsed.
 * @param hexChainId
 * @param tokenAddress
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
 * @param hex
 */
function hexBalanceToDecimal(hex: string): string {
  try {
    return BigInt(hex).toString();
  } catch {
    return '0';
  }
}

/**
 * Returns true when hexBalance represents a non-zero value.
 * @param hexBalance
 */
function isNonZeroHexBalance(hexBalance: unknown): hexBalance is string {
  if (typeof hexBalance !== 'string') {
    return false;
  }
  try {
    return BigInt(hexBalance) > BigInt(0);
  } catch {
    return false;
  }
}

/**
 * Returns true when amount (a decimal string, possibly with fractional part)
 * represents a non-zero value.
 * @param amount
 */
function isNonZeroAmount(amount: unknown): amount is string {
  if (typeof amount !== 'string') {
    return false;
  }
  try {
    return parseFloat(amount) > 0;
  } catch {
    return false;
  }
}

/**
 * Derive the AssetsController token type from a CAIP-19 asset namespace.
 *
 * Supported mappings:
 * - erc20  → 'erc20'
 * - spl    → 'spl'
 * - slip44 → 'native'
 * - anything else → 'spl' (safe default for non-EVM snap assets)
 * @param assetId
 */
function assetTypeFromCaip19(assetId: string): 'erc20' | 'spl' | 'native' {
  const slashIdx = assetId.indexOf('/');
  if (slashIdx === -1) {
    return 'erc20';
  }
  const assetPart = assetId.slice(slashIdx + 1);
  const namespace = assetPart.slice(0, assetPart.indexOf(':'));
  if (namespace === 'erc20') {
    return 'erc20';
  }
  if (namespace === 'slip44') {
    return 'native';
  }
  if (namespace === 'spl') {
    return 'spl';
  }
  return 'spl';
}

// ─── EVM migration ─────────────────────────────────────────────────────────────

function migrateEvmTokens(
  data: Record<string, unknown>,
  ac: {
    assetsInfo: Record<string, unknown>;
    assetsBalance: Record<string, Record<string, { amount: string }>>;
    customAssets: Record<string, string[]>;
  },
  addressToId: Record<string, string>,
): boolean {
  if (
    !hasProperty(data, 'TokensController') ||
    !isObject(data.TokensController) ||
    !hasProperty(data.TokensController, 'allTokens') ||
    !isObject(data.TokensController.allTokens)
  ) {
    return false;
  }

  // tokenBalances[accountAddressLowercase][chainIdHex][tokenAddressChecksummed] = hexBalance
  const tokenBalances =
    hasProperty(data, 'TokenBalancesController') &&
    isObject(data.TokenBalancesController) &&
    hasProperty(data.TokenBalancesController, 'tokenBalances') &&
    isObject(data.TokenBalancesController.tokenBalances)
      ? (data.TokenBalancesController.tokenBalances as Record<
          string,
          Record<string, Record<string, string>>
        >)
      : {};

  let changed = false;

  for (const [hexChainId, accountTokens] of Object.entries(
    data.TokensController.allTokens,
  )) {
    if (!isObject(accountTokens)) {
      continue;
    }

    for (const [rawAccountAddress, tokens] of Object.entries(accountTokens)) {
      if (!Array.isArray(tokens)) {
        continue;
      }

      const accountAddress = rawAccountAddress.toLowerCase();
      const accountId = addressToId[accountAddress];
      if (!accountId) {
        continue;
      }

      const chainBalances = isObject(tokenBalances[accountAddress])
        ? tokenBalances[accountAddress]
        : {};
      const chainLevelBalances = isObject(chainBalances[hexChainId])
        ? (chainBalances[hexChainId] as Record<string, string>)
        : {};

      for (const token of tokens) {
        if (!isObject(token)) {
          continue;
        }
        if (typeof token.address !== 'string' || !token.address) {
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

        // Write metadata once (first write wins; do not overwrite API data)
        if (!ac.assetsInfo[assetId]) {
          const symbol = typeof token.symbol === 'string' ? token.symbol : '';
          let name = '';
          if (typeof token.name === 'string') {
            name = token.name;
          } else if (typeof token.symbol === 'string') {
            name = token.symbol;
          }
          ac.assetsInfo[assetId] = {
            type: 'erc20' as const,
            symbol,
            name,
            decimals: typeof token.decimals === 'number' ? token.decimals : 0,
            ...(typeof token.image === 'string' && token.image
              ? { image: token.image }
              : {}),
            ...(Array.isArray(token.aggregators)
              ? { aggregators: token.aggregators }
              : {}),
          };
          changed = true;
        }

        // Look up balance. tokenBalances stores token addresses as checksummed.
        const checksummedTokenAddress = toChecksumHexAddress(token.address);
        const hexBalance = chainLevelBalances[checksummedTokenAddress];

        if (isNonZeroHexBalance(hexBalance)) {
          // Non-zero balance → assetsBalance
          ac.assetsBalance[accountId] ??= {};
          if (!ac.assetsBalance[accountId][assetId]) {
            ac.assetsBalance[accountId][assetId] = {
              amount: hexBalanceToDecimal(hexBalance),
            };
            changed = true;
          }
        } else {
          // Zero or missing balance → customAssets (user opted in, needs polling)
          ac.customAssets[accountId] ??= [];
          if (!ac.customAssets[accountId].includes(assetId)) {
            ac.customAssets[accountId].push(assetId);
            changed = true;
          }
        }
      }
    }
  }

  return changed;
}

// ─── Non-EVM migration ─────────────────────────────────────────────────────────

function migrateNonEvmAssets(
  data: Record<string, unknown>,
  ac: {
    assetsInfo: Record<string, unknown>;
    assetsBalance: Record<string, Record<string, { amount: string }>>;
    customAssets: Record<string, string[]>;
  },
): boolean {
  if (
    !hasProperty(data, 'MultichainAssetsController') ||
    !isObject(data.MultichainAssetsController) ||
    !hasProperty(data.MultichainAssetsController, 'accountsAssets') ||
    !isObject(data.MultichainAssetsController.accountsAssets)
  ) {
    return false;
  }

  // assetsMetadata[caipAssetType] = SnapsFungibleAssetMetadata
  // SnapsFungibleAssetMetadata: { fungible: true, name?, symbol?, iconUrl, units: [{decimals}] }
  const snapsMetadata =
    hasProperty(data.MultichainAssetsController, 'assetsMetadata') &&
    isObject(data.MultichainAssetsController.assetsMetadata)
      ? data.MultichainAssetsController.assetsMetadata
      : {};

  // balances[accountId][assetId] = { amount: string, unit: string }
  const multichainBalances =
    hasProperty(data, 'MultichainBalancesController') &&
    isObject(data.MultichainBalancesController) &&
    hasProperty(data.MultichainBalancesController, 'balances') &&
    isObject(data.MultichainBalancesController.balances)
      ? data.MultichainBalancesController.balances
      : {};

  let changed = false;

  for (const [accountId, assetIds] of Object.entries(
    data.MultichainAssetsController.accountsAssets,
  )) {
    if (!Array.isArray(assetIds)) {
      continue;
    }

    const accountBalances = isObject(multichainBalances[accountId])
      ? (multichainBalances[accountId] as Record<
          string,
          { amount: string; unit: string }
        >)
      : {};

    for (const assetId of assetIds) {
      if (typeof assetId !== 'string' || !assetId) {
        continue;
      }

      // Write metadata once, converting from snaps-sdk format
      if (!ac.assetsInfo[assetId]) {
        const snapMeta = snapsMetadata[assetId];
        if (isObject(snapMeta) && snapMeta.fungible === true) {
          const units = Array.isArray(snapMeta.units) ? snapMeta.units : [];
          const primaryUnit = isObject(units[0]) ? units[0] : null;

          let symbol = '';
          if (typeof snapMeta.symbol === 'string') {
            symbol = snapMeta.symbol;
          } else if (typeof primaryUnit?.symbol === 'string') {
            symbol = primaryUnit.symbol;
          }
          ac.assetsInfo[assetId] = {
            type: assetTypeFromCaip19(assetId),
            symbol,
            name: typeof snapMeta.name === 'string' ? snapMeta.name : '',
            decimals:
              primaryUnit !== null && typeof primaryUnit.decimals === 'number'
                ? primaryUnit.decimals
                : 0,
            ...(typeof snapMeta.iconUrl === 'string' && snapMeta.iconUrl
              ? { image: snapMeta.iconUrl }
              : {}),
          };
          changed = true;
        }
      }

      const balanceEntry = accountBalances[assetId];
      const amount =
        isObject(balanceEntry) && typeof balanceEntry.amount === 'string'
          ? balanceEntry.amount
          : undefined;

      if (isNonZeroAmount(amount)) {
        // Non-zero balance → assetsBalance
        ac.assetsBalance[accountId] ??= {};
        if (!ac.assetsBalance[accountId][assetId]) {
          ac.assetsBalance[accountId][assetId] = { amount };
          changed = true;
        }
      } else {
        // Zero or missing balance → customAssets
        ac.customAssets[accountId] ??= [];
        if (!ac.customAssets[accountId].includes(assetId)) {
          ac.customAssets[accountId].push(assetId);
          changed = true;
        }
      }
    }
  }

  return changed;
}
