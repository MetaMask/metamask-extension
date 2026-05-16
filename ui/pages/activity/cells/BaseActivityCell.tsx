import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '@metamask/design-system-react';
import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { getImageForChainId } from '../../../selectors/multichain';
import { useGetLabel } from '../useGetLabel';
import type { ActivityCellProps } from './types';

type BaseActivityCellProps = ActivityCellProps & {
  description?: string;
  iconClassName?: string;
  iconName: IconName;
};

export function BaseActivityCell({
  data,
  description: descriptionOverride,
  iconClassName = 'bg-muted text-primary-default',
  iconName,
}: BaseActivityCellProps) {
  const { description: labelDescription, title } = useGetLabel(data);
  const description = descriptionOverride ?? labelDescription;
  const shortHash = data.data.hash?.slice(0, 6);
  const chainId = convertCaipToHexChainId(data.chainId);
  const networkName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
    data.chainId;

  return (
    <Box className="px-4 py-3 border-b border-border-muted">
      <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClassName}`}
          >
            <Icon name={iconName} size={IconSize.Md} />
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-background-default p-0.5">
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              name={networkName}
              src={getImageForChainId(chainId)}
            />
          </div>
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
