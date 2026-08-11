import { useMemo } from 'react';
import {
  type CaipAssetType,
  isStrictHexString,
  parseCaipAssetType,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import { getUseExternalServices } from '../../../selectors';
import { getFungibleAssetForRoute } from '../../../selectors/assets';
import { getIsSecurityTrustTdpEnabled } from '../../../selectors/multichain/feature-flags';
import { getAllMultichainNetworkConfigurations } from '../../../selectors/multichain/networks';
import {
  getFeatureTags,
  getResultTypeConfig,
  getSecurityAlertIconProps,
  getTop10HoldingPct,
} from '../utils/security-utils';
import {
  getSecurityTrustTokenTypeLabel,
  toSecurityTrustChainId,
} from '../utils/security-trust-utils';
import { getFungibleAssetBlockExplorerLink } from '../../../helpers/utils/multichain/blockExplorer';
import { processAssetParams, resolveAssetRouteLookup } from '../util';
import type { SecurityTrustLocationState } from '../types/security-trust';

export const useSecurityTrustPageData = () => {
  const t = useI18nContext();
  const location = useLocation();
  const params = useParams();
  const locationState = location.state as
    | SecurityTrustLocationState
    | undefined;

  const { chainId, assetId, decodedAsset } = resolveAssetRouteLookup(
    processAssetParams(params),
  );

  const routeAsset = useSelector((state) =>
    getFungibleAssetForRoute(state, { assetId, chainId, decodedAsset }),
  );
  const useExternalServices = useSelector(getUseExternalServices);
  const isSecurityTrustTdpEnabled = useSelector(getIsSecurityTrustTdpEnabled);
  const isEnabled = useExternalServices && isSecurityTrustTdpEnabled;
  const resolvedAssetId =
    isEnabled && assetId ? (assetId as CaipAssetType) : null;

  const {
    securityData: fetchedSecurityData,
    isLoading,
    symbol: fetchedSymbol,
    decimals: fetchedDecimals,
    address: fetchedAddress,
    isNative: fetchedIsNative,
  } = useTokenSecurityData({
    assetId: resolvedAssetId,
    prefetchedData: isEnabled
      ? (locationState?.securityData ?? undefined)
      : undefined,
  });

  const parsedAssetMetadata = useMemo(() => {
    if (!assetId) {
      return null;
    }

    try {
      const { assetReference, assetNamespace } = parseCaipAssetType(assetId);
      return {
        address: assetReference,
        isNative: assetNamespace === 'slip44',
      };
    } catch {
      return null;
    }
  }, [assetId]);

  const securityData =
    fetchedSecurityData ??
    (isEnabled ? (locationState?.securityData ?? null) : null);
  const symbol =
    locationState?.symbol ?? fetchedSymbol ?? routeAsset?.symbol ?? '';
  const decimals =
    locationState?.decimals ?? fetchedDecimals ?? routeAsset?.decimals;
  const isNative =
    locationState?.isNative ??
    fetchedIsNative ??
    routeAsset?.isNative ??
    parsedAssetMetadata?.isNative ??
    false;
  const tokenAddress =
    locationState?.address ??
    fetchedAddress ??
    routeAsset?.address ??
    parsedAssetMetadata?.address;

  const evmNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const allMultichainNetworkConfigurations = useSelector(
    getAllMultichainNetworkConfigurations,
  );

  const caipChainId = toSecurityTrustChainId(locationState?.chainId ?? chainId);

  const networkName = useMemo(() => {
    if (caipChainId) {
      return allMultichainNetworkConfigurations[caipChainId]?.name;
    }

    if (chainId && isStrictHexString(chainId)) {
      return evmNetworkConfigurations[chainId]?.name;
    }

    return undefined;
  }, [
    allMultichainNetworkConfigurations,
    caipChainId,
    chainId,
    evmNetworkConfigurations,
  ]);

  const translate = t as (key: string, substitutions?: string[]) => string;
  const config = getResultTypeConfig(securityData?.resultType, translate);
  const { tags: featureTags } = getFeatureTags(
    securityData?.features ?? [],
    securityData?.resultType,
    translate,
    true,
  );
  const alertIconProps = getSecurityAlertIconProps(config.alertSeverity);

  const fees = securityData?.fees ?? null;
  const financialStats = securityData?.financialStats ?? null;
  const metadata = securityData?.metadata ?? null;
  const top10Pct = getTop10HoldingPct(financialStats);
  const otherPct = top10Pct === null ? null : Math.max(0, 100 - top10Pct);

  const formattedCreatedDate = useMemo(() => {
    const raw = securityData?.created;
    if (!raw) {
      return t('securityTrustNa');
    }
    try {
      return new Date(raw).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return raw;
    }
  }, [securityData?.created, t]);

  const tokenAgeDisplay = useMemo(() => {
    const raw = securityData?.created;
    if (!raw) {
      return t('securityTrustNa');
    }
    try {
      const diffMs = Date.now() - new Date(raw).getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (days < 30) {
        return `${days}d`;
      }
      if (days < 365) {
        return `${Math.floor(days / 30)}mo`;
      }
      return `${Math.floor(days / 365)}yr`;
    } catch {
      return t('securityTrustNa');
    }
  }, [securityData?.created, t]);

  const tokenType = getSecurityTrustTokenTypeLabel(
    assetId as CaipAssetType | undefined,
    isNative,
  );

  const blockExplorerLink = useMemo(
    () =>
      getFungibleAssetBlockExplorerLink({
        caipChainId,
        tokenAddress,
        isNative,
        evmNetworkConfigurations,
        multichainNetworkConfigurations: allMultichainNetworkConfigurations,
        fallbackExplorerLabel: t('securityTrustEtherscan') as string,
      }),
    [
      allMultichainNetworkConfigurations,
      caipChainId,
      evmNetworkConfigurations,
      isNative,
      t,
      tokenAddress,
    ],
  );

  return {
    t,
    isLoading,
    securityData,
    config,
    featureTags,
    alertIconProps,
    fees,
    financialStats,
    metadata,
    top10Pct,
    otherPct,
    symbol,
    decimals,
    chainId: caipChainId,
    formattedCreatedDate,
    tokenAgeDisplay,
    tokenType,
    networkName,
    blockExplorerLink,
  };
};
