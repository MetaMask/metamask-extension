import { useMemo } from 'react';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipChainId,
  isStrictHexString,
  parseCaipAssetType,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import { getFungibleAssetForRoute } from '../../../selectors/assets';
import { getAllMultichainNetworkConfigurations } from '../../../selectors/multichain/networks';
import {
  getFeatureTags,
  getResultTypeConfig,
  getSecurityAlertIconProps,
  getTop10HoldingPct,
} from '../utils/security-utils';
import { processAssetParams, resolveAssetRouteLookup } from '../util';
import type { SecurityTrustLocationState } from '../types/security-trust';

const getCaipChainIdForLookup = (
  chainId: Hex | CaipChainId | undefined,
): CaipChainId | undefined => {
  if (!chainId) {
    return undefined;
  }

  if (isCaipChainId(chainId)) {
    return chainId;
  }

  if (isEvmChainId(chainId)) {
    return toEvmCaipChainId(chainId);
  }

  return undefined;
};

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

  const {
    securityData: fetchedSecurityData,
    isLoading,
    symbol: fetchedSymbol,
    decimals: fetchedDecimals,
    address: fetchedAddress,
    isNative: fetchedIsNative,
  } = useTokenSecurityData({
    assetId: (assetId ?? null) as CaipAssetType | null,
    prefetchedData: locationState?.securityData ?? undefined,
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
    fetchedSecurityData ?? locationState?.securityData ?? null;
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

  const caipChainIdForLookup = getCaipChainIdForLookup(chainId);

  const networkName = useMemo(() => {
    if (!chainId) {
      return undefined;
    }

    if (caipChainIdForLookup) {
      return allMultichainNetworkConfigurations[caipChainIdForLookup]?.name;
    }

    if (isStrictHexString(chainId)) {
      return evmNetworkConfigurations[chainId]?.name;
    }

    return undefined;
  }, [
    allMultichainNetworkConfigurations,
    caipChainIdForLookup,
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

  const tokenType = isNative ? 'Native' : 'ERC-20';

  const blockExplorerLink = useMemo(() => {
    if (!tokenAddress || isNative || !chainId || !isEvmChainId(chainId)) {
      return null;
    }

    let evmHexChainId: Hex | undefined;
    if (isStrictHexString(chainId)) {
      evmHexChainId = chainId;
    } else if (caipChainIdForLookup) {
      evmHexChainId = convertCaipToHexChainId(caipChainIdForLookup);
    } else {
      evmHexChainId = undefined;
    }

    const evmNetworkConfig = evmHexChainId
      ? evmNetworkConfigurations[evmHexChainId]
      : undefined;

    const multichainNetworkConfig = caipChainIdForLookup
      ? allMultichainNetworkConfigurations[caipChainIdForLookup]
      : undefined;

    const defaultIdx = evmNetworkConfig?.defaultBlockExplorerUrlIndex;
    const blockExplorerUrl =
      defaultIdx === undefined
        ? ''
        : (evmNetworkConfig?.blockExplorerUrls?.[defaultIdx] ?? '');

    const contractAddress = isCaipChainId(tokenAddress)
      ? parseCaipAssetType(tokenAddress as CaipAssetType).assetReference
      : tokenAddress;

    return {
      url: getTokenTrackerLink(contractAddress, chainId, '', '', {
        blockExplorerUrl,
      }),
      name:
        multichainNetworkConfig?.name ??
        evmNetworkConfig?.name ??
        t('securityTrustEtherscan'),
    };
  }, [
    allMultichainNetworkConfigurations,
    caipChainIdForLookup,
    chainId,
    evmNetworkConfigurations,
    isNative,
    t,
    tokenAddress,
  ]);

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
    formattedCreatedDate,
    tokenAgeDisplay,
    tokenType,
    networkName,
    blockExplorerLink,
  };
};
