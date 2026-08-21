import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isStrictHexString } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  getAllEnabledNetworksForAllNamespaces,
  getAllMultichainNetworkConfigurations,
} from '../../../../selectors/multichain/networks';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import {
  getShowTestNetworks,
  getUseExternalServices,
} from '../../../../selectors';
import { useNetworkManagerState } from '../../../multichain/network-manager/hooks/useNetworkManagerState';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getNetworkIcon } from '../../../../../shared/lib/network.utils';

const toCaipChainId = (chainId: string) =>
  isStrictHexString(chainId) ? toEvmCaipChainId(chainId) : chainId;

export function useNetworkFilterButtonIcon():
  | { name: string; src?: string }
  | undefined {
  const enabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);
  const allNetworks = useSelector(getAllMultichainNetworkConfigurations);

  return useMemo(() => {
    if (enabledNetworks.length !== 1) {
      return undefined;
    }

    const network = allNetworks[toCaipChainId(enabledNetworks[0])];
    return network
      ? { name: network.name, src: getNetworkIcon(network) }
      : undefined;
  }, [allNetworks, enabledNetworks]);
}

export function useNetworkFilterButtonLabel(): string {
  const t = useI18nContext();
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const allCaipNetworks = useSelector(getAllNetworkConfigurationsByCaipChainId);
  const showTestnets = useSelector(getShowTestNetworks);
  const useExternalServices = useSelector(getUseExternalServices);
  const { nonTestNetworks: customNetworkMap, testNetworks: testNetworkMap } =
    useNetworkManagerState();

  const hasOnlyDefaultNetworks = useMemo(() => {
    const hasVisibleCustomNetworks = Object.values(customNetworkMap).some(
      (network) => useExternalServices || network.isEvm,
    );
    const hasVisibleTestNetworks =
      showTestnets &&
      Object.values(testNetworkMap).some(
        (network) => useExternalServices || network.isEvm,
      );

    return !hasVisibleCustomNetworks && !hasVisibleTestNetworks;
  }, [customNetworkMap, showTestnets, testNetworkMap, useExternalServices]);

  const totalEnabledNetworkCount = allEnabledNetworksForAllNamespaces.length;

  return useMemo(() => {
    if (totalEnabledNetworkCount === 1) {
      const chainId = allEnabledNetworksForAllNamespaces[0];
      const caipChainId = toCaipChainId(chainId);
      const networkName =
        allCaipNetworks[caipChainId]?.name ?? t('currentNetwork');
      return `${t('network')}: ${networkName}`;
    }
    // > 1 network selected, show whether that means every visible network or
    // only the default-network set.
    if (totalEnabledNetworkCount > 1) {
      return hasOnlyDefaultNetworks
        ? t('allNetworks')
        : t('allDefaultNetworks');
    }

    if (totalEnabledNetworkCount === 0) {
      return t('noNetworksSelected');
    }

    return t('popularNetworks');
  }, [
    allCaipNetworks,
    allEnabledNetworksForAllNamespaces,
    hasOnlyDefaultNetworks,
    t,
    totalEnabledNetworkCount,
  ]);
}
