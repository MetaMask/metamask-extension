import React, { useMemo } from 'react';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';

// HyperLiquid asset icons base URL
const HYPERLIQUID_ASSET_ICONS_BASE_URL = 'https://app.hyperliquid.xyz/coins/';

export type PerpsTokenLogoProps = {
  /** Asset symbol (e.g., "BTC", "ETH", "xyz:TSLA") */
  symbol: string;
  /** Size of the avatar */
  size?: AvatarTokenSize;
  /** Additional CSS class */
  className?: string;
};

/**
 * Extract the display symbol from a full symbol string
 * Strips DEX prefix for HIP-3 markets (e.g., "xyz:TSLA" -> "TSLA")
 *
 * @param symbol - The symbol to extract the display name from
 * @returns The display name
 * @example
 * getDisplaySymbol('xyz:TSLA') => 'TSLA'
 * getDisplaySymbol('BTC') => 'BTC'
 */
const getDisplaySymbol = (symbol: string): string => {
  if (!symbol || typeof symbol !== 'string') {
    return symbol;
  }
  const colonIndex = symbol.indexOf(':');
  if (colonIndex > 0 && colonIndex < symbol.length - 1) {
    return symbol.substring(colonIndex + 1);
  }
  return symbol;
};

/**
 * Generate the icon URL for an asset symbol
 * Handles both regular assets and HIP-3 assets (dex:symbol format)
 *
 * @param symbol - The symbol to generate the icon URL for
 * @returns The icon URL
 * @example
 * getAssetIconUrl('BTC') => 'https://app.hyperliquid.xyz/coins/BTC.svg'
 * getAssetIconUrl('xyz:TSLA') => 'https://app.hyperliquid.xyz/coins/xyz:TSLA.svg'
 */
const getAssetIconUrl = (symbol: string): string => {
  if (!symbol) {
    return '';
  }

  // Check for HIP-3 asset (contains colon)
  if (symbol.includes(':')) {
    const [dex, assetSymbol] = symbol.split(':');
    return `${HYPERLIQUID_ASSET_ICONS_BASE_URL}${dex.toLowerCase()}:${assetSymbol.toUpperCase()}.svg`;
  }

  // Regular asset - uppercase the symbol
  return `${HYPERLIQUID_ASSET_ICONS_BASE_URL}${symbol.toUpperCase()}.svg`;
};

/**
 * PerpsTokenLogo component displays asset icons for perps trading
 * Uses HyperLiquid's asset icon CDN with fallback to first letter
 *
 * @param options0 - Component props
 * @param options0.symbol - The symbol to display
 * @param options0.size - The size of the avatar
 * @param options0.className - Additional CSS class
 */
export const PerpsTokenLogo: React.FC<PerpsTokenLogoProps> = ({
  symbol,
  size = AvatarTokenSize.Md,
  className,
}) => {
  const iconUrl = useMemo(() => getAssetIconUrl(symbol), [symbol]);
  const displaySymbol = useMemo(() => getDisplaySymbol(symbol), [symbol]);

  return (
    <AvatarToken
      name={displaySymbol}
      src={iconUrl}
      size={size}
      className={className}
      data-testid={`perps-token-logo-${symbol}`}
    />
  );
};

export default PerpsTokenLogo;
