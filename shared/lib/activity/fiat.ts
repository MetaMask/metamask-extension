import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import type { CaipAssetType, Hex } from '@metamask/utils';
import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
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

// Converts TokenAmount to unsigned human-readable numeric string (e.g. "1", "1.5")
export function getHumanReadableTokenAmount(
  token: TokenAmount,
): string | undefined {
  if (!token.amount) {
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

    if (assetNamespace === 'slip44' || assetNamespace === 'native') {
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
