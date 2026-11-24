import React from 'react';
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
  const label = useAddressLabel({
    address,
    chainId,
    enabled: !displayName,
  });

  return (
    <>
      {t(labelKey, [
        displayName || label || shortenDisplayAddress(address) || fallback,
      ])}
    </>
  );
}
