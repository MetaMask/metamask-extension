import {
  BannerAlertSeverity,
  Box,
} from '@metamask/design-system-react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTokenSecurityData } from '../../../../hooks/useTokenSecurityData';
import { selectIsTokenSecurityTrustEnabled } from '../../../../selectors/security-trust/feature-flags';
import {
  getResultTypeConfig,
  type ResultTypeConfig,
} from '../../utils/security-utils';
import { SecurityBanner } from './security-banner';
import {
  SecurityTrustEntryCard,
  type SecurityTrustEntryCardToken,
} from './security-trust-entry-card';
import { SecurityTrustVerifiedBadge } from './security-trust-inline-badge';

export type AssetPageSecurityTrustToken = {
  symbol: string;
  name?: string;
  chainId: string;
  address?: string;
  decimals?: number;
  isNative?: boolean;
  image?: string;
};

type AssetPageSecurityTrustProviderProps = {
  assetId: CaipAssetType | null | undefined;
  token: AssetPageSecurityTrustToken;
  children: ReactNode;
};

type AssetPageSecurityTrustContextValue = {
  isEnabled: boolean;
  securityConfig: ResultTypeConfig;
  securityData: TokenSecurityData | null;
  isLoading: boolean;
  entryCardToken: SecurityTrustEntryCardToken | null;
  showVerifiedBadge: boolean;
  showSecurityBanner: boolean;
  showSecurityTrustSection: boolean;
  securityBannerDescription: string;
};

const AssetPageSecurityTrustContext =
  createContext<AssetPageSecurityTrustContextValue | null>(null);

const useAssetPageSecurityTrustContext = () =>
  useContext(AssetPageSecurityTrustContext);

/**
 * Provides Security & Trust data and visibility for the Token Details Page.
 * Wrap TDP content once, then place slot components where needed.
 */
export const AssetPageSecurityTrustProvider = ({
  assetId,
  token,
  children,
}: AssetPageSecurityTrustProviderProps) => {
  const t = useI18nContext();
  const isEnabled = useSelector(selectIsTokenSecurityTrustEnabled);
  const resolvedAssetId =
    isEnabled && assetId ? (assetId as CaipAssetType) : null;

  const {
    securityData,
    isLoading: isSecurityDataLoading,
    error: securityDataError,
  } = useTokenSecurityData({
    assetId: resolvedAssetId,
  });

  const securityConfig = getResultTypeConfig(
    securityData?.resultType,
    t as (key: string, substitutions?: string[]) => string,
  );

  const tokenDisplaySymbol = token.symbol || token.name || '';
  const securityBannerDescription = useMemo(() => {
    if (securityData?.resultType === 'Malicious') {
      return tokenDisplaySymbol
        ? t('securityTrustMaliciousTokenBannerDescription', [
            tokenDisplaySymbol,
          ])
        : t('securityTrustMaliciousTokenBannerDescriptionNoSymbol');
    }

    return tokenDisplaySymbol
      ? t('securityTrustSuspiciousTokenDescription', [tokenDisplaySymbol])
      : t('securityTrustSuspiciousTokenDescriptionNoSymbol');
  }, [securityData?.resultType, t, tokenDisplaySymbol]);

  const entryCardToken = useMemo<SecurityTrustEntryCardToken | null>(() => {
    if (!resolvedAssetId) {
      return null;
    }

    return {
      ...token,
      assetId: resolvedAssetId,
    };
  }, [resolvedAssetId, token]);

  const contextValue = useMemo<AssetPageSecurityTrustContextValue>(
    () => ({
      isEnabled,
      securityConfig,
      securityData,
      isLoading: isSecurityDataLoading,
      entryCardToken,
      showVerifiedBadge:
        isEnabled && securityData?.resultType === 'Verified',
      showSecurityBanner:
        isEnabled &&
        !!securityData &&
        (securityData.resultType === 'Malicious' ||
          securityData.resultType === 'Warning' ||
          securityData.resultType === 'Spam'),
      showSecurityTrustSection:
        isEnabled &&
        !securityDataError &&
        (isSecurityDataLoading || !!securityData?.resultType),
      securityBannerDescription,
    }),
    [
      entryCardToken,
      isEnabled,
      isSecurityDataLoading,
      securityBannerDescription,
      securityConfig,
      securityData,
      securityDataError,
    ],
  );

  return (
    <AssetPageSecurityTrustContext.Provider value={contextValue}>
      {children}
    </AssetPageSecurityTrustContext.Provider>
  );
};

/** Verified badge shown next to the asset name on TDP. */
export const AssetPageSecurityTrustHeaderBadge = () => {
  const context = useAssetPageSecurityTrustContext();

  if (
    !context?.showVerifiedBadge ||
    !context.securityConfig.badge
  ) {
    return null;
  }

  return <SecurityTrustVerifiedBadge badge={context.securityConfig.badge} />;
};

/** Warning banner shown below the token name row on TDP. */
export const AssetPageSecurityTrustBanner = () => {
  const t = useI18nContext();
  const context = useAssetPageSecurityTrustContext();

  if (!context?.showSecurityBanner || !context.securityData) {
    return null;
  }

  const { securityData, securityConfig, securityBannerDescription } = context;
  const isMalicious = securityData.resultType === 'Malicious';

  return (
    <Box marginTop={3} marginBottom={3} paddingLeft={4} paddingRight={4}>
      <SecurityBanner
        securityConfig={securityConfig}
        severity={
          isMalicious
            ? BannerAlertSeverity.Danger
            : BannerAlertSeverity.Warning
        }
        testId={
          isMalicious ? 'security-banner-malicious' : 'security-banner-warning'
        }
        title={
          isMalicious ? t('securityTrustMaliciousTokenTitle') : undefined
        }
        description={securityBannerDescription}
      />
    </Box>
  );
};

/** Entry card section shown above Token details on TDP. */
export const AssetPageSecurityTrustSection = () => {
  const context = useAssetPageSecurityTrustContext();

  if (
    !context?.showSecurityTrustSection ||
    !context.entryCardToken
  ) {
    return null;
  }

  return (
    <Box paddingLeft={4} paddingRight={4} data-testid="security-trust-section">
      <SecurityTrustEntryCard
        securityData={context.securityData ?? null}
        isLoading={context.isLoading}
        token={context.entryCardToken}
      />
    </Box>
  );
};
