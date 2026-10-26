import { isCaipChainId, type CaipAssetType, type Hex } from '@metamask/utils';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../../../../shared/constants/multichain/assets';
import {
  MULTICHAIN_NETWORK_TO_NICKNAME,
  MULTICHAIN_PROVIDER_CONFIGS,
  MULTICHAIN_TOKEN_IMAGE_MAP,
} from '../../../../../shared/constants/multichain/networks';
import { type TokenWithFiatAmount } from '../types';

/**
 * Marker set on placeholder rows so they can be told apart from real assets
 * (they carry no balance and must never be used to compute totals).
 */
export const UNAVAILABLE_BALANCE_PLACEHOLDER =
  'unavailable-balance-placeholder';

export type UnavailableBalancePlaceholderToken = TokenWithFiatAmount & {
  placeholder: typeof UNAVAILABLE_BALANCE_PLACEHOLDER;
};

/**
 * Whether a token row is a "Balance unavailable" placeholder.
 *
 * @param token - Token row.
 * @returns True for placeholder rows built by `buildUnavailableBalancePlaceholderTokens`.
 */
export function isUnavailableBalancePlaceholder(
  token: TokenWithFiatAmount,
): token is UnavailableBalancePlaceholderToken {
  return (
    (token as Partial<UnavailableBalancePlaceholderToken>).placeholder ===
    UNAVAILABLE_BALANCE_PLACEHOLDER
  );
}

/**
 * Builds one native-asset row per chain whose balance could not be fetched
 * and that has no native asset row in the list yet.
 *
 * When a snap never managed to fetch an account's balance (for example a
 * freshly created Bitcoin account whose first scan failed), the account has no
 * asset for that chain, so the "All networks" list would show nothing for it
 * and the failure would only be visible as a badge next to the total. The
 * placeholder row renders the chain's native asset with "Balance unavailable"
 * (see `TokenCell`), so the user can see which network is affected and retry.
 *
 * @param options - Options.
 * @param options.unavailableChainIds - CAIP-2 chains whose balance is unavailable.
 * @param options.tokens - Rows already in the list.
 * @param options.isChainShown - Whether rows of a chain are shown in the list
 * (enabled network, basic functionality...).
 * @returns Placeholder rows, in the order of `unavailableChainIds`.
 */
export function buildUnavailableBalancePlaceholderTokens({
  unavailableChainIds,
  tokens,
  isChainShown,
}: {
  unavailableChainIds: string[];
  tokens: TokenWithFiatAmount[];
  isChainShown: (chainId: string) => boolean;
}): UnavailableBalancePlaceholderToken[] {
  if (unavailableChainIds.length === 0) {
    return [];
  }
  const chainsWithNativeRow = new Set(
    tokens.filter((token) => token.isNative).map((token) => token.chainId),
  );
  const placeholders: UnavailableBalancePlaceholderToken[] = [];
  for (const chainId of new Set(unavailableChainIds)) {
    if (
      !isCaipChainId(chainId) ||
      chainsWithNativeRow.has(chainId as Hex) ||
      !isChainShown(chainId)
    ) {
      continue;
    }
    const nativeAssetId = MULTICHAIN_NETWORK_TO_ASSET_TYPES[chainId]?.[0] as
      | CaipAssetType
      | undefined;
    const config = MULTICHAIN_PROVIDER_CONFIGS[chainId];
    if (!nativeAssetId || !config) {
      // Unknown chain: nothing meaningful to render, the total still shows
      // the "Balance unavailable" badge.
      continue;
    }
    const name = MULTICHAIN_NETWORK_TO_NICKNAME[chainId] ?? config.nickname;
    placeholders.push({
      placeholder: UNAVAILABLE_BALANCE_PLACEHOLDER,
      address: nativeAssetId,
      assetId: nativeAssetId,
      caipAssetId: nativeAssetId,
      chainId,
      symbol: config.ticker,
      name,
      title: name,
      image: MULTICHAIN_TOKEN_IMAGE_MAP[chainId] ?? '',
      decimals: config.decimals,
      isNative: true,
      // No balance: the row renders "Balance unavailable" instead.
      balance: undefined,
      tokenFiatAmount: null,
      secondary: null,
    });
  }
  return placeholders;
}
