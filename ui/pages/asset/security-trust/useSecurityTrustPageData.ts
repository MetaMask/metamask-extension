import { useMemo } from 'react';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import {
  type CaipAssetType,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain';
import {
  getFeatureTags,
  getResultTypeConfig,
  getSecurityAlertIconProps,
  getTop10HoldingPct,
} from '../utils/security-utils';
import { processAssetParams, resolveAssetRouteLookup } from '../util';
import type { SecurityTrustLocationState } from '../types/security-trust';

export const useSecurityTrustPageData = () => {
  const t = useI18nContext();
  const location = useLocation();
  const params = useParams();
  const locationState = location.state as
    | SecurityTrustLocationState
    | undefined;

  const { chainId, assetId } = resolveAssetRouteLookup(
    processAssetParams(params),
  );

  const { securityData: fetchedSecurityData, isLoading } = useTokenSecurityData(
    {
      assetId: (assetId ?? null) as CaipAssetType | null,
      prefetchedData: locationState?.securityData ?? undefined,
    },
  );

  const securityData =
    fetchedSecurityData ?? locationState?.securityData ?? null;
  const symbol = locationState?.symbol ?? '';
  const decimals = locationState?.decimals;
  const isNative = locationState?.isNative ?? false;
  const tokenAddress = locationState?.address;

  const evmNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const multichainNetworkConfigurations = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const networkName = useMemo(() => {
    if (!chainId) {
      return undefined;
    }
    if (isCaipChainId(chainId)) {
      return multichainNetworkConfigurations[chainId]?.name;
    }
    return evmNetworkConfigurations[chainId]?.name;
  }, [chainId, evmNetworkConfigurations, multichainNetworkConfigurations]);

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
    const networkConfig = isCaipChainId(chainId)
      ? multichainNetworkConfigurations[chainId]
      : evmNetworkConfigurations[chainId];
    const defaultIdx = networkConfig?.defaultBlockExplorerUrlIndex;
    const blockExplorerUrl =
      defaultIdx === undefined
        ? ''
        : (networkConfig?.blockExplorerUrls?.[defaultIdx] ?? '');

    const contractAddress = isCaipChainId(tokenAddress)
      ? parseCaipAssetType(tokenAddress as CaipAssetType).assetReference
      : tokenAddress;

    return {
      url: getTokenTrackerLink(contractAddress, chainId, '', '', {
        blockExplorerUrl,
      }),
      name: networkConfig?.name ?? t('securityTrustEtherscan'),
    };
  }, [
    tokenAddress,
    isNative,
    chainId,
    evmNetworkConfigurations,
    multichainNetworkConfigurations,
    t,
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
