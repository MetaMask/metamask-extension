import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  Text,
} from '@metamask/design-system-react';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_NETWORK_TO_NICKNAME } from '../../../../shared/constants/multichain/networks';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { getImageForChainId } from '../../../selectors/multichain';
import { useGetLabel } from '../useGetLabel';
import type { ActivityCellProps } from './types';

type GenericActivityCellProps = ActivityCellProps & {
  description?: string;
};

export function GenericActivityCell({
  data,
  description: descriptionOverride,
}: GenericActivityCellProps) {
  const { description: labelDescription, title } = useGetLabel(data);
  const description = descriptionOverride ?? labelDescription;
  const shortHash = data.data.hash?.slice(0, 6);
  const { namespace } = parseCaipChainId(data.chainId);
  const chainId =
    namespace === KnownCaipNamespace.Eip155
      ? convertCaipToHexChainId(data.chainId)
      : data.chainId;
  const networkName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
    MULTICHAIN_NETWORK_TO_NICKNAME[
      data.chainId as keyof typeof MULTICHAIN_NETWORK_TO_NICKNAME
    ] ??
    data.chainId;
  const networkIconSrc = getImageForChainId(chainId);

  return (
    <Box className="px-4 py-3 transition-transform duration-200 ease-out">
      <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3">
        <div className="relative flex items-center justify-center">
          <BadgeWrapper
            badge={
              <div className="rounded-full bg-background-default p-0.5">
                <AvatarNetwork
                  size={AvatarNetworkSize.Xs}
                  name={networkName}
                  src={networkIconSrc}
                />
              </div>
            }
          >
            <AvatarToken
              className="size-8"
              name="token"
              size={AvatarTokenSize.Md}
            />
          </BadgeWrapper>
        </div>
        <div className="min-w-0">
          <Text className="font-medium truncate">{title}</Text>
          {description ? (
            <Text variant="body-sm" className="text-alternative truncate">
              {description}
            </Text>
          ) : null}
        </div>
        <div className="text-right whitespace-nowrap">
          <Text className="text-sm text-alternative">{data.type}</Text>
          {shortHash ? (
            <Text variant="body-sm" className="text-alternative">
              {shortHash}
            </Text>
          ) : null}
        </div>
      </div>
    </Box>
  );
}
