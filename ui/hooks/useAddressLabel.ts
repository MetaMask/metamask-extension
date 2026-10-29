import {
  AddressScanResultType,
  type AddressScanResult,
} from '@metamask/phishing-controller';
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

function extractLabel(scan: AddressScanResult | null) {
  if (!scan) {
    return '';
  }

  const { result_type: resultType, label = '' } = scan;

  return resultType === AddressScanResultType.Malicious ||
    resultType === AddressScanResultType.ErrorResult
    ? ''
    : label;
}

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

  const { data } = useQuery({
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
    select: extractLabel,
  });

  return data ?? '';
}
