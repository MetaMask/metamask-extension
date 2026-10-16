import { useState } from 'react';
import { useSelector } from 'react-redux';
import { queryOptions, useQueryClient } from '@tanstack/react-query';
import {
  AddressScanResultType,
  type AddressScanResult,
} from '@metamask/phishing-controller';
import type { CaipChainId } from '@metamask/utils';
import {
  fetchEvmAddressScan,
  isEvmAddressScanChainId,
} from '../../shared/lib/bridge-utils/security-alerts-api.util';
import { getUseExternalServices } from '../selectors';

function getQueryOptions(chainId: CaipChainId, address: string) {
  return queryOptions({
    queryKey: [
      'securityAlerts',
      'evmAddressScan',
      chainId.toLowerCase(),
      address.toLowerCase(),
    ],
    queryFn: () => fetchEvmAddressScan(chainId, address),
    staleTime: Infinity,
    retry: false,
  });
}

function getFriendlyLabel({
  result_type: resultType,
  label,
}: AddressScanResult) {
  return resultType === AddressScanResultType.Malicious ||
    resultType === AddressScanResultType.ErrorResult
    ? ''
    : label;
}

export function useResolveAddressLabel() {
  const queryClient = useQueryClient();
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const [names, setNames] = useState<Record<string, string>>({});

  return ({ address, chainId }: { address?: string; chainId: CaipChainId }) => {
    if (
      !address ||
      !isExternalServicesEnabled ||
      !isEvmAddressScanChainId(chainId)
    ) {
      return '';
    }

    const options = getQueryOptions(chainId, address);
    const key = options.queryKey.join('/');

    if (key in names) {
      return names[key];
    }

    const cachedScanResult = queryClient.getQueryData(options.queryKey);
    if (cachedScanResult) {
      return getFriendlyLabel(cachedScanResult);
    }

    queryClient.query(options).then((scanResult) => {
      setNames((current) => ({
        ...current,
        [key]: getFriendlyLabel(scanResult),
      }));
    });

    return '';
  };
}
