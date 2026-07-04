import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isStrictHexString } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { getAllEnabledNetworksForAllNamespaces } from '../../../../selectors/multichain/networks';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import {
  getShowTestNetworks,
  getUseExternalServices,
} from '../../../../selectors';
import { useNetworkManagerState } from '../../../multichain/network-manager/hooks/useNetworkManagerState';
import { useI18nContext } from '../../../../hooks/useI18nContext';

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
      const caipChainId = isStrictHexString(chainId)
        ? toEvmCaipChainId(chainId)
        : chainId;
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
