import React from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
  AvatarIcon,
  AvatarIconSize,
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  BoxSpacing,
} from '@metamask/design-system-react';
import { PermissionsCellTooltip } from './permissions-cell-tooltip';

// Define types for networks permissions
type Network = {
  name: string;
  chainId: string;
  caipChainId: CaipChainId;
};

type PermissionsCellConnectionListItemProps = {
  title: string;
  iconName: IconName;
  count: number;
  networks: Network[];
  countMessage: string;
  paddingTopValue: BoxSpacing;
  paddingBottomValue: BoxSpacing;
  onClick: () => void;
};

export const PermissionsCellConnectionListItem = ({
  title,
  iconName,
  count,
  networks,
  countMessage,
  paddingTopValue,
  paddingBottomValue,
  onClick,
}: PermissionsCellConnectionListItemProps) => {
  return (
    <Box
      data-testid="permissions-cell-connection-list-item"
      alignItems={BoxAlignItems.Baseline}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      gap={4}
      className="multichain-permissions-list-item"
      paddingTop={paddingTopValue}
      paddingBottom={paddingBottomValue}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <AvatarIcon
        iconName={iconName}
        size={AvatarIconSize.Md}
        color={IconColor.IconAlternative}
      />
      <Box
        flexDirection={BoxFlexDirection.Column}
        style={{ alignSelf: 'center', flexGrow: 1 }}
        gap={1}
      >
        <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Left}>
          {title}
        </Text>
        <Box alignItems={BoxAlignItems.Center} gap={1}>
          <Text
            color={TextColor.TextAlternative}
            variant={TextVariant.BodySm}
            ellipsis
          >
            {count} {countMessage}
          </Text>
          <PermissionsCellTooltip networks={networks} />
        </Box>
      </Box>
      <Icon
        name={IconName.ArrowRight}
        color={IconColor.IconAlternative}
        size={IconSize.Sm}
      />
    </Box>
  );
};
