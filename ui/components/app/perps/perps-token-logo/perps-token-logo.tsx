import React, { useMemo, useState, useEffect } from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  twMerge,
} from '@metamask/design-system-react';
import { getDisplaySymbol, getAssetIconUrls } from '../utils';
import { Skeleton } from '../../../component-library/skeleton';
import { BorderRadius } from '../../../../helpers/constants/design-system';
import { useTheme } from '../../../../hooks/useTheme';
import { ThemeType } from '../../../../../shared/constants/preferences';
import {
  ASSETS_REQUIRING_DARK_BG,
  ASSETS_REQUIRING_LIGHT_BG,
} from './perps-asset-bg-config';

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
  const theme = useTheme();
  const bgClass = useMemo(() => {
    const upperSymbol = displaySymbol.toUpperCase();

    if (
      theme === ThemeType.dark &&
      ASSETS_REQUIRING_LIGHT_BG.has(upperSymbol)
    ) {
      return 'bg-white';
    }

    if (
      theme === ThemeType.light &&
      ASSETS_REQUIRING_DARK_BG.has(upperSymbol)
    ) {
      return 'bg-icon-default';
    }

    return '';
  }, [displaySymbol, theme]);
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
      className={twMerge(bgClass, className)}
      data-testid={`perps-token-logo-${sanitizedSymbol}`}
    />
  );
};

export default PerpsTokenLogo;
