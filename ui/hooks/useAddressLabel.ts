import { useSelector } from 'react-redux';
import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  AddressScanResultType,
  type AddressScanResult,
} from '@metamask/phishing-controller';
import type { CaipChainId } from '@metamask/utils';
import {
  fetchEvmAddressScan,
  isEvmAddressScanChainId,
  isSecurityAlertsAPIEnabled,
} from '#shared/lib/bridge-utils/security-alerts-api.util';
import { getUseExternalServices } from '../selectors';

function extractLabel({ result_type: resultType, label }: AddressScanResult) {
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
      isSecurityAlertsAPIEnabled() &&
      isEvmAddressScanChainId(chainId),
    select: extractLabel,
  });

  return data ?? '';
}
