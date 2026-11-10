import { useSelector } from 'react-redux';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { CaipChainId } from '@metamask/utils';
import {
  fetchEvmAddressScan,
  hasEvmChainName,
  isSecurityAlertsAPIEnabled,
} from '#shared/lib/bridge-utils/security-alerts-api.util';
import {
  getIsAddressResolutionEnabled,
  getUseExternalServices,
} from '../selectors';

export function useAddressLabel({
  address,
  chainId,
  enabled = true,
}: {
  address: string;
  chainId: CaipChainId;
  enabled?: boolean;
}) {
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const isAddressResolutionFeatureEnabled = useSelector(
    getIsAddressResolutionEnabled,
  );

  return useQuery({
    ...queryOptions({
      queryKey: ['evmAddressScan', chainId, address.toLowerCase()],
      queryFn: () => fetchEvmAddressScan(chainId, address),
      staleTime: Infinity,
      retry: false,
    }),
    enabled:
      enabled &&
      Boolean(address) &&
      isExternalServicesEnabled &&
      isAddressResolutionFeatureEnabled &&
      isSecurityAlertsAPIEnabled() &&
      hasEvmChainName(chainId),
  });
}
