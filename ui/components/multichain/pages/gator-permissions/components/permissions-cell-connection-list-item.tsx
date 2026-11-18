import React from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  AvatarIcon,
  AvatarIconSize,
  BoxBackgroundColor,
  BoxSpacing,
  ContentVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
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
    <ListItem
      variant={ContentVariant.TwoLines}
      isInteractive
      onClick={onClick}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      // The parent permissions cell owns the surrounding padding; ListItem's
      // default padded row chrome is stripped so the row keeps only the
      // dynamic vertical spacing.
      className={`multichain-permissions-list-item px-0 py-0 min-h-0 pt-${paddingTopValue} pb-${paddingBottomValue}`}
      data-testid="permissions-cell-connection-list-item"
      avatar={
        <AvatarIcon
          iconName={iconName}
          size={AvatarIconSize.Md}
          color={IconColor.IconAlternative}
        />
      }
      title={title}
      description={`${count} ${countMessage}`}
      descriptionProps={{ ellipsis: true }}
      descriptionEndAccessory={<PermissionsCellTooltip networks={networks} />}
      endAccessory={
        <Icon
          name={IconName.ArrowRight}
          color={IconColor.IconAlternative}
          size={IconSize.Sm}
        />
      }
    />
  );
};
