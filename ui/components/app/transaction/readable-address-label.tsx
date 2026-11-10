import React from 'react';
import { AddressScanResultType } from '@metamask/phishing-controller';
import type { CaipChainId } from '@metamask/utils';
import { useAddressLabel } from '#ui/hooks/useAddressLabel';
import {
  shortenDisplayAddress,
  useGetDisplayName,
} from '#ui/hooks/useGetDisplayName';
import { useI18nContext } from '../../../hooks/useI18nContext';

type Props = {
  labelKey: string;
  address: string;
  chainId: CaipChainId;
  fallback: string;
};

export function ReadableAddressLabel({
  labelKey,
  address,
  chainId,
  fallback,
}: Props) {
  const t = useI18nContext();
  const getDisplayName = useGetDisplayName();
  const displayName = getDisplayName(address);
  const { data: scan } = useAddressLabel({ address, chainId });
  const resultType = scan?.result_type;
  const isMalicious = resultType === AddressScanResultType.Malicious;
  const label =
    isMalicious || resultType === AddressScanResultType.ErrorResult
      ? ''
      : (scan?.label ?? '');

  return (
    <span>
      {t(labelKey, [
        displayName || label || shortenDisplayAddress(address) || fallback,
      ])}
    </span>
  );
}
