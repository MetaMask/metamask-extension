import React, { useMemo } from 'react';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';
import { getDisplaySymbol, getAssetIconUrl } from '../utils';

export type PerpsTokenLogoProps = {
  /** Asset symbol (e.g., "BTC", "ETH", "xyz:TSLA") */
  symbol: string;
  /** Size of the avatar */
  size?: AvatarTokenSize;
  /** Additional CSS class */
  className?: string;
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

  // Sanitize symbol for test ID (e.g., xyz:TSLA -> xyz-TSLA)
  const sanitizedSymbol = symbol.replace(/:/gu, '-');

  return (
    <AvatarToken
      name={displaySymbol}
      src={iconUrl}
      size={size}
      className={className}
      data-testid={`perps-token-logo-${sanitizedSymbol}`}
    />
  );
};

export default PerpsTokenLogo;
