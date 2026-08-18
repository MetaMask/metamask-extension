import {
  formatChainIdToCaip,
  isNativeAddress,
} from '@metamask/bridge-controller';
import {
  isCaipAssetType,
  parseCaipAssetType,
  type CaipAssetType,
} from '@metamask/utils';
import { toAssetId } from '../../../../shared/lib/asset-utils';

/**
 * Minimal token shape accepted by `openBridgeExperience` as the swap source.
 */
export type BalanceAwareSwapSourceToken = {
  symbol: string;
  address: string;
  decimals?: number;
  name?: string;
  chainId: string;
};

/**
 * Account-group asset shape used for selecting a funded swap source.
 * Matches the fields relied on from `getAssetsBySelectedAccountGroup`.
 */
export type BalanceAwareUserAsset = {
  assetId: string;
  address?: string;
  /** Absent on assets that are only identified by their `assetsByChain` key. */
  chainId?: string;
  symbol: string;
  name?: string;
  decimals: number;
  isNative: boolean;
  fiat?: { balance?: number } | null;
  balance?: string;
};

/** A user asset whose chain id has been resolved from its `assetsByChain` key. */
type ChainScopedUserAsset = BalanceAwareUserAsset & { chainId: string };

export type BalanceAwareSwapDefaults = {
  sourceToken: BalanceAwareSwapSourceToken;
  /**
   * CAIP-19 asset id for the destination token when the current token has no
   * balance and a funded alternate source was selected. `undefined` keeps the
   * Swap UI's default destination selection.
   */
  destTokenAssetId?: string;
};

export type GetBalanceAwareSwapDefaultsParams = {
  currentToken: BalanceAwareSwapSourceToken;
  /**
   * Balance rendered for the token on the Token Detail Page, when available.
   * The account-group assets are also consulted, so a missing or unparsable
   * value here never hides a holding the wallet knows about.
   */
  currentTokenBalance?: string | number;
  /**
   * Assets for the selected account group, keyed by chain id.
   */
  assetsByChain: Record<string, BalanceAwareUserAsset[]>;
};

/**
 * Whether a balance value represents a positive holding.
 *
 * @param balance - Numeric or display balance string (commas allowed).
 * @returns True when the parsed balance is a finite number greater than zero.
 */
export function hasPositiveTokenBalance(
  balance?: string | number | null,
): boolean {
  if (typeof balance === 'number') {
    return Number.isFinite(balance) && balance > 0;
  }

  if (typeof balance === 'string') {
    const parsedBalance = Number(balance.replace(/,/gu, '').trim());
    return Number.isFinite(parsedBalance) && parsedBalance > 0;
  }

  return false;
}

/**
 * Normalizes an address or CAIP-19 asset id to a comparable lowercase reference.
 *
 * @param addressOrAssetId - Hex address or CAIP-19 asset id.
 * @returns Lowercase asset reference / address, or an empty string when absent.
 */
function getComparableAddress(addressOrAssetId?: string): string {
  if (!addressOrAssetId) {
    return '';
  }

  if (isCaipAssetType(addressOrAssetId)) {
    return parseCaipAssetType(addressOrAssetId).assetReference.toLowerCase();
  }

  return addressOrAssetId.toLowerCase();
}

/**
 * Whether two chain ids refer to the same network.
 *
 * @param leftChainId - First chain id (hex or CAIP-2).
 * @param rightChainId - Second chain id (hex or CAIP-2).
 * @returns True when both normalize to the same CAIP-2 chain id.
 */
function areSameChain(leftChainId?: string, rightChainId?: string): boolean {
  if (!leftChainId || !rightChainId) {
    return false;
  }

  try {
    return (
      formatChainIdToCaip(leftChainId) === formatChainIdToCaip(rightChainId)
    );
  } catch {
    return leftChainId.toLowerCase() === rightChainId.toLowerCase();
  }
}

/**
 * Whether a user asset is the same token as the Token Detail Page asset.
 *
 * Matching requires both chain and address so native tokens that share the
 * zero address across chains are not treated as identical.
 *
 * @param asset - Candidate user asset.
 * @param currentToken - Token shown on the Token Detail Page.
 * @returns True when address and chain both match.
 */
function isSameTokenAsCurrent(
  asset: BalanceAwareUserAsset,
  currentToken: BalanceAwareSwapSourceToken,
): boolean {
  if (!areSameChain(asset.chainId, currentToken.chainId)) {
    return false;
  }

  // Native assets are keyed by `slip44` asset ids, which never match the zero
  // address the Token Detail Page uses for the native token.
  if (
    asset.isNative &&
    currentToken.address &&
    isNativeAddress(currentToken.address)
  ) {
    return true;
  }

  const assetAddress = getComparableAddress(asset.address ?? asset.assetId);
  const currentAddress = getComparableAddress(currentToken.address);

  return assetAddress !== '' && assetAddress === currentAddress;
}

/**
 * Fiat balance used for ranking eligible swap sources.
 *
 * @param asset - User asset.
 * @returns Fiat balance, or 0 when missing.
 */
function getFiatBalance(asset: BalanceAwareUserAsset): number {
  return asset.fiat?.balance ?? 0;
}

/**
 * Whether an asset can fund a swap (positive fiat balance).
 *
 * @param asset - User asset.
 * @returns True when fiat balance is greater than zero.
 */
function hasEligibleFiatBalance(asset: BalanceAwareUserAsset): boolean {
  return getFiatBalance(asset) > 0;
}

/**
 * Converts a user asset into the source-token shape expected by bridge entry.
 *
 * @param asset - Selected user asset.
 * @returns Source token for `openBridgeExperience`.
 */
function toSourceToken(
  asset: ChainScopedUserAsset,
): BalanceAwareSwapSourceToken {
  return {
    address: asset.address ?? asset.assetId,
    chainId: asset.chainId,
    decimals: asset.decimals,
    symbol: asset.symbol,
    name: asset.name ?? asset.symbol,
  };
}

/**
 * Flattens account-group assets, falling back to the map key for assets that
 * carry no chain id of their own.
 *
 * @param assetsByChain - Assets keyed by chain id.
 * @returns Flat list of assets, each with a chain id.
 */
function flattenAssets(
  assetsByChain: Record<string, BalanceAwareUserAsset[]>,
): ChainScopedUserAsset[] {
  return Object.entries(assetsByChain).flatMap(([chainId, assets]) =>
    (assets ?? []).map((asset) => ({ ...asset, chainId: asset.chainId ?? chainId })),
  );
}

/**
 * Flattens account-group assets and keeps only those that can open a swap:
 * a positive fiat balance and an identifier the bridge can resolve.
 *
 * @param assetsByChain - Assets keyed by chain id.
 * @returns Flat list of funded assets.
 */
function getFundedAssets(
  assetsByChain: Record<string, BalanceAwareUserAsset[]>,
): ChainScopedUserAsset[] {
  return flattenAssets(assetsByChain).filter(
    (asset) =>
      hasEligibleFiatBalance(asset) &&
      Boolean(asset.address ?? asset.assetId) &&
      Boolean(asset.symbol),
  );
}

/**
 * Selects the best funded swap source when the current token has no balance.
 *
 * Priority (aligned with mobile ASSETS-2972 / sticky swap defaults):
 * 1. Same-chain token (not current) with the highest fiat balance
 * 2. Native token on any chain with the highest fiat balance
 * 3. Last swapped token — not supported yet (needs data source)
 * 4. Most used token — not supported yet (needs data source)
 * 5. Fallback: any token on any chain with the highest fiat balance
 *
 * @param currentToken - Token shown on the Token Detail Page.
 * @param assetsByChain - Assets for the selected account group.
 * @returns Best alternate source token, or `null` when none are eligible.
 */
export function selectBestSwapSourceToken(
  currentToken: BalanceAwareSwapSourceToken,
  assetsByChain: Record<string, BalanceAwareUserAsset[]>,
): BalanceAwareSwapSourceToken | null {
  const fundedAssets = getFundedAssets(assetsByChain).filter(
    (asset) => !isSameTokenAsCurrent(asset, currentToken),
  );

  if (fundedAssets.length === 0) {
    return null;
  }

  const sameChainAssets = fundedAssets
    .filter((asset) => areSameChain(asset.chainId, currentToken.chainId))
    .sort((left, right) => getFiatBalance(right) - getFiatBalance(left));

  if (sameChainAssets.length > 0) {
    return toSourceToken(sameChainAssets[0]);
  }

  const crossChainAssets = [...fundedAssets].sort(
    (left, right) => getFiatBalance(right) - getFiatBalance(left),
  );

  const nativeAsset = crossChainAssets.find((asset) => asset.isNative);
  if (nativeAsset) {
    return toSourceToken(nativeAsset);
  }

  // Priority 3 – Last swapped token (needs selector/data source)
  // Priority 4 – Most used token (needs selector/data source)

  return toSourceToken(crossChainAssets[0]);
}

/**
 * Whether the token on the Token Detail Page can fund a swap.
 *
 * The page balance and the account-group assets are both consulted because the
 * page derives its balance from a route lookup that can miss a held token.
 *
 * @param currentToken - Token shown on the Token Detail Page.
 * @param currentTokenBalance - Balance rendered by the Token Detail Page.
 * @param assetsByChain - Assets for the selected account group.
 * @returns True when the current token holds funds.
 */
function isCurrentTokenFunded(
  currentToken: BalanceAwareSwapSourceToken,
  currentTokenBalance: string | number | undefined,
  assetsByChain: Record<string, BalanceAwareUserAsset[]>,
): boolean {
  if (hasPositiveTokenBalance(currentTokenBalance)) {
    return true;
  }

  const match = flattenAssets(assetsByChain).find((asset) =>
    isSameTokenAsCurrent(asset, currentToken),
  );

  if (!match) {
    return false;
  }

  return hasPositiveTokenBalance(match.balance) || hasEligibleFiatBalance(match);
}

/**
 * Builds balance-aware Swap from/to defaults for Token Detail Page entry.
 *
 * If the current token has balance, use it as "from" and leave "to" default.
 * If the current token has no balance, pick a funded "from" and set the current
 * token as "to" so the Swap screen opens actionable. If no funded alternate
 * exists, fall back to current as "from".
 *
 * @param params - Current token, its rendered balance, and user assets.
 * @param params.currentToken
 * @param params.currentTokenBalance
 * @param params.assetsByChain
 * @returns Source token and optional destination CAIP-19 asset id.
 */
export function getBalanceAwareSwapDefaults({
  currentToken,
  currentTokenBalance,
  assetsByChain,
}: GetBalanceAwareSwapDefaultsParams): BalanceAwareSwapDefaults {
  if (isCurrentTokenFunded(currentToken, currentTokenBalance, assetsByChain)) {
    return {
      sourceToken: currentToken,
    };
  }

  const bestSource = selectBestSwapSourceToken(currentToken, assetsByChain);
  if (!bestSource) {
    return {
      sourceToken: currentToken,
    };
  }

  const destTokenAssetId = toAssetId(
    currentToken.address,
    formatChainIdToCaip(currentToken.chainId),
  ) as CaipAssetType | undefined;

  return {
    sourceToken: bestSource,
    destTokenAssetId,
  };
}
