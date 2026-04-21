import React, { useMemo, useState, useEffect } from 'react';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';
import { getDisplaySymbol, getAssetIconUrls } from '../utils';
import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';

export type PerpsTokenLogoProps = {
  /** Asset symbol (e.g., "BTC", "ETH", "xyz:TSLA") */
  symbol: string;
  /** Size of the avatar */
  size?: AvatarTokenSize;
  /** Additional CSS class */
  className?: string;
};

// Maps AvatarTokenSize → Tailwind classes matching AvatarBase dimensions
const AVATAR_SIZE_CLASS: Record<AvatarTokenSize, string> = {
  [AvatarTokenSize.Xs]: 'h-4 w-4',
  [AvatarTokenSize.Sm]: 'h-6 w-6',
  [AvatarTokenSize.Md]: 'h-8 w-8',
  [AvatarTokenSize.Lg]: 'h-10 w-10',
  [AvatarTokenSize.Xl]: 'h-12 w-12',
};

export const PerpsTokenLogo: React.FC<PerpsTokenLogoProps> = ({
  symbol,
  size = AvatarTokenSize.Md,
  className,
}) => {
  const displaySymbol = useMemo(() => getDisplaySymbol(symbol), [symbol]);
  const sanitizedSymbol = symbol.replace(/:/gu, '-');
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!symbol) {
      setResolvedSrc(undefined);
      setIsResolving(false);
      return undefined;
    }

    const iconUrls = getAssetIconUrls(symbol);
    if (!iconUrls) {
      setResolvedSrc(undefined);
      setIsResolving(false);
      return undefined;
    }

    setResolvedSrc(undefined);
    setIsResolving(true);
    let cancelled = false;
    const urls = [iconUrls.primary, iconUrls.fallback];
    let idx = 0;

    const tryNext = () => {
      if (cancelled || idx >= urls.length) {
        if (!cancelled) {
          setIsResolving(false);
        }
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        if (!cancelled) {
          setResolvedSrc(urls[idx]);
          setIsResolving(false);
        }
      };
      img.onerror = () => {
        idx += 1;
        tryNext();
      };
      img.src = urls[idx];
    };
    tryNext();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (isResolving) {
    return (
      <Skeleton
        className={`shrink-0 ${AVATAR_SIZE_CLASS[size]} ${className ?? ''}`}
        borderRadius={BorderRadius.full}
        data-testid={`perps-token-logo-${sanitizedSymbol}`}
      />
    );
  }

  return (
    <AvatarToken
      name={displaySymbol}
      src={resolvedSrc}
      size={size}
      className={className}
      data-testid={`perps-token-logo-${sanitizedSymbol}`}
    />
  );
};

export default PerpsTokenLogo;
