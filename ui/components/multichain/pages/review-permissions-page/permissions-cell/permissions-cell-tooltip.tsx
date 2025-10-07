import React from 'react';
import { Tooltip } from 'react-tippy';
import {
  BoxAlignItems,
  BoxFlexDirection,
  TextColor,
  TextVariant,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '@metamask/design-system-react';
import { AvatarType } from '../../../avatar-group/avatar-group.types';
import { AvatarGroup } from '../../../avatar-group';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

// Define types for networks permissions
type Network = {
  name: string;
  chainId: string;
};

type PermissionsCellTooltipProps = {
  networks: Network[];
};

export const PermissionsCellTooltip = ({
  networks,
}: PermissionsCellTooltipProps) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 4;
  const TOOLTIP_LIMIT = 4;

  const avatarNetworksData = networks?.map((network) => ({
    avatarValue: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
    symbol: network.name,
  }));

  if (!networks || networks.length === 0) {
    return null;
  }

  return (
    <Tooltip
      position="bottom"
      html={
        <Box
          flexDirection={BoxFlexDirection.Column}
          data-test-id="permissions-cell-tooltip"
        >
          <Box flexDirection={BoxFlexDirection.Column}>
            {networks?.slice(0, TOOLTIP_LIMIT).map((network) => {
              return (
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  key={network.chainId}
                  padding={1}
                  gap={2}
                >
                  <AvatarNetwork
                    size={AvatarNetworkSize.Xs}
                    src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
                    name={network.name}
                  />
                  <Text
                    color={TextColor.OverlayInverse}
                    variant={TextVariant.BodyMd}
                    data-testid="permissions-cell-network-name"
                    ellipsis
                  >
                    {network.name}
                  </Text>
                </Box>
              );
            })}
            {networks?.length > TOOLTIP_LIMIT ? (
              <Box alignItems={BoxAlignItems.Center}>
                <Text
                  color={TextColor.TextMuted}
                  variant={TextVariant.BodyMd}
                  data-testid="permissions-cell-plus-more-tooltip"
                >
                  {t('moreNetworks', [networks.length - TOOLTIP_LIMIT])}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>
      }
      arrow
      offset={0}
      delay={50}
      duration={0}
      size="small"
      trigger="mouseenter"
      theme="dark"
    >
      <AvatarGroup
        members={avatarNetworksData}
        limit={AVATAR_GROUP_LIMIT}
        avatarType={AvatarType.TOKEN}
      />
    </Tooltip>
  );
};
