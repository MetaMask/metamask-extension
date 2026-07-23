import { BannerAlertSeverity, Box } from '@metamask/design-system-react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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
import { SecurityTrustInfoModal } from './security-trust-info-modal';
import type { SecurityTrustSheetParams } from './security-trust-sheet-types';
import { getSecurityTrustInfoSheetParams } from './use-security-trust-info-sheet';
import {
  getSecurityTrustCtaSheetParams,
  shouldGateSecurityTrustCta,
} from './use-security-trust-cta-gate';

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

type SecurityTrustCtaSource = 'buy' | 'swap';

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
  openInfoSheet: () => void;
  gateCtaAction: (action: () => void, source: SecurityTrustCtaSource) => void;
};

const AssetPageSecurityTrustContext =
  createContext<AssetPageSecurityTrustContextValue | null>(null);

const useAssetPageSecurityTrustContext = () =>
  useContext(AssetPageSecurityTrustContext);

/**
 * Optional CTA gate hook for Buy/Swap buttons inside the provider tree.
 * Returns undefined when rendered outside the provider.
 */
export const useAssetPageSecurityTrustCtaGate = () => {
  const context = useAssetPageSecurityTrustContext();
  return context?.gateCtaAction;
};

/**
 * Provides Security & Trust data and visibility for the Token Details Page.
 * Wrap TDP content once, then place slot components where needed.
 *
 * @param options - Provider options.
 * @param options.assetId - CAIP-19 asset ID for security data fetch.
 * @param options.token - Token metadata for display and analytics context.
 * @param options.children - TDP content to wrap.
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
  const [sheetParams, setSheetParams] =
    useState<SecurityTrustSheetParams | null>(null);
  const [pendingProceed, setPendingProceed] = useState<(() => void) | null>(
    null,
  );

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

  const closeSheet = useCallback(() => {
    setSheetParams(null);
    setPendingProceed(null);
  }, []);

  const openInfoSheet = useCallback(() => {
    if (!securityData) {
      return;
    }

    const params = getSecurityTrustInfoSheetParams(
      securityData,
      securityConfig,
      tokenDisplaySymbol || undefined,
    );

    if (params) {
      setPendingProceed(null);
      setSheetParams(params);
    }
  }, [securityConfig, securityData, tokenDisplaySymbol]);

  const gateCtaAction = useCallback(
    (action: () => void, source: SecurityTrustCtaSource) => {
      if (
        !securityData ||
        !shouldGateSecurityTrustCta(securityData.resultType)
      ) {
        action();
        return;
      }

      const params = getSecurityTrustCtaSheetParams(
        securityData,
        securityConfig,
        tokenDisplaySymbol || undefined,
        action,
        source,
      );

      if (!params) {
        action();
        return;
      }

      setPendingProceed(() => action);
      setSheetParams(params);
    },
    [securityConfig, securityData, tokenDisplaySymbol],
  );

  const handleProceed = useCallback(() => {
    pendingProceed?.();
    closeSheet();
  }, [closeSheet, pendingProceed]);

  const contextValue = useMemo<AssetPageSecurityTrustContextValue>(
    () => ({
      isEnabled,
      securityConfig,
      securityData,
      isLoading: isSecurityDataLoading,
      entryCardToken,
      showVerifiedBadge: isEnabled && securityData?.resultType === 'Verified',
      showSecurityBanner:
        isEnabled &&
        Boolean(securityData) &&
        (securityData.resultType === 'Malicious' ||
          securityData.resultType === 'Warning' ||
          securityData.resultType === 'Spam'),
      showSecurityTrustSection:
        isEnabled &&
        !securityDataError &&
        (isSecurityDataLoading || Boolean(securityData?.resultType)),
      securityBannerDescription,
      openInfoSheet,
      gateCtaAction,
    }),
    [
      entryCardToken,
      gateCtaAction,
      isEnabled,
      isSecurityDataLoading,
      openInfoSheet,
      securityBannerDescription,
      securityConfig,
      securityData,
      securityDataError,
    ],
  );

  return (
    <AssetPageSecurityTrustContext.Provider value={contextValue}>
      {children}
      <SecurityTrustInfoModal
        isOpen={Boolean(sheetParams)}
        onClose={closeSheet}
        onProceed={pendingProceed ? handleProceed : undefined}
        sheetParams={sheetParams}
      />
    </AssetPageSecurityTrustContext.Provider>
  );
};

/** Verified badge shown next to the asset name on TDP. */
export const AssetPageSecurityTrustHeaderBadge = () => {
  const context = useAssetPageSecurityTrustContext();

  if (!context?.showVerifiedBadge || !context.securityConfig.badge) {
    return null;
  }

  return (
    <SecurityTrustVerifiedBadge
      badge={context.securityConfig.badge}
      onClick={context.openInfoSheet}
    />
  );
};

/** Warning banner shown below the token name row on TDP. */
export const AssetPageSecurityTrustBanner = () => {
  const t = useI18nContext();
  const context = useAssetPageSecurityTrustContext();

  if (!context?.showSecurityBanner || !context.securityData) {
    return null;
  }

  const {
    securityData,
    securityConfig,
    securityBannerDescription,
    openInfoSheet,
  } = context;
  const isMalicious = securityData.resultType === 'Malicious';

  return (
    <Box marginTop={3} marginBottom={3} paddingLeft={4} paddingRight={4}>
      <SecurityBanner
        securityConfig={securityConfig}
        severity={
          isMalicious ? BannerAlertSeverity.Danger : BannerAlertSeverity.Warning
        }
        testId={
          isMalicious ? 'security-banner-malicious' : 'security-banner-warning'
        }
        title={isMalicious ? t('securityTrustMaliciousTokenTitle') : undefined}
        description={securityBannerDescription}
        onClick={openInfoSheet}
      />
    </Box>
  );
};

/** Entry card section shown above Token details on TDP. */
export const AssetPageSecurityTrustSection = () => {
  const context = useAssetPageSecurityTrustContext();

  if (!context?.showSecurityTrustSection || !context.entryCardToken) {
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
