import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import type { CaipAssetType, Hex } from '@metamask/utils';
import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import { isNativeCaipAssetId } from '../asset-utils';
import { formatUnits } from '../unit';
import type { Token } from '../multichain/types';
import type { TokenAmount } from './types';

export function calculateFiatFromMarketRates(
  amount: string | undefined,
  token: Token | undefined,
  marketRates: Record<number, Record<string, number>>,
) {
  if (amount === undefined || !token) {
    return undefined;
  }

  const parsed = Number.parseFloat(amount);
  const rate = marketRates[Number.parseInt(token.chainId, 16)]?.[token.address];
  return rate === undefined ? undefined : parsed * rate;
}

export function getDisplaySignPrefix(
  direction: TokenAmount['direction'],
  { showPlus }: { showPlus: boolean },
): string {
  if (direction === 'out') {
    return '-';
  }

  if (direction === 'in' && showPlus) {
    return '+';
  }

  return '';
}

/**
 * Whether the amount is raw base units of an unknown scale.
 *
 * `assetType` is only set by the EVM mappers, whose amounts are always base
 * units, so an absent `decimals` there means the scale is unknown rather than
 * 0 — scaling by 0 renders e.g. 167.1211 USDT as "167121100" and feeds that
 * same number to fiat. Sources that emit already-human amounts (ramps,
 * keyring) deliberately omit `decimals` and never set `assetType`, so they are
 * unaffected. TMCU-1303.
 * @param token
 */
function hasUnknownScale(token: TokenAmount): boolean {
  return (
    token.decimals === undefined &&
    (token.assetType === 'erc20' || token.assetType === 'native')
  );
}

// Converts TokenAmount to unsigned human-readable numeric string (e.g. "1", "1.5")
export function getHumanReadableTokenAmount(
  token: TokenAmount,
): string | undefined {
  if (
    token.amount === undefined ||
    token.amount === null ||
    token.amount === ''
  ) {
    // Mapper fail-closed (client-utils / TMCU-1303) omits amount when the scale
    // is unknown but keeps symbol/assetId. Do not invent "0" — that looks like
    // a real zero transfer and scares users.
    if (token.assetType === 'erc20' || token.assetType === 'native') {
      return undefined;
    }
    // `@metamask/client-utils` omits zero native `txParams.value` from mapped
    // tokens but still provides symbol/asset metadata. Treat that as 0 so
    // Activity can render "-0 ETH" for zero-value contract calls / sends.
    if (token.symbol || token.assetId) {
      return '0';
    }
    return undefined;
  }

  // No amount is better than an amount inflated by the token's full precision.
  if (hasUnknownScale(token)) {
    return undefined;
  }

  let value: string;
  try {
    value = formatUnits(BigInt(token.amount), token.decimals ?? 0);
  } catch {
    value = token.amount;
  }

  return value.startsWith('-') ? value.slice(1) : value;
}

// Applies display + or - sign to a formatted display value
export function applyDisplaySign(
  formattedDisplay: string,
  signPrefix: string,
): string {
  if (
    signPrefix === '+' &&
    !formattedDisplay.startsWith('+') &&
    !formattedDisplay.startsWith('-')
  ) {
    return `+${formattedDisplay}`;
  }

  if (
    signPrefix === '-' &&
    !formattedDisplay.startsWith('-') &&
    !formattedDisplay.startsWith('+')
  ) {
    return `-${formattedDisplay}`;
  }

  return formattedDisplay;
}

export function getTokenAddressForMarketRates(
  assetId: CaipAssetType | undefined,
): string | undefined {
  if (!assetId) {
    return undefined;
  }

  if (assetId.includes('/slip44:') || assetId.includes('/native:')) {
    return NATIVE_TOKEN_ADDRESS;
  }

  try {
    const { assetNamespace, assetReference } = parseCaipAssetType(assetId);

    if (assetNamespace === 'erc20' && typeof assetReference === 'string') {
      return assetReference.toLowerCase();
    }

    if (isNativeCaipAssetId(assetId) || assetNamespace === 'native') {
      return NATIVE_TOKEN_ADDRESS;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function toMarketRateLookupToken(
  token: TokenAmount,
  hexChainId: Hex,
): Token | undefined {
  const assetId = isCaipAssetType(token.assetId) ? token.assetId : undefined;
  const address = getTokenAddressForMarketRates(assetId);

  if (!address) {
    return undefined;
  }

  return {
    address,
    symbol: token.symbol ?? '',
    decimals: token.decimals ?? 0,
    chainId: hexChainId,
  };
}
