import React from 'react';
import {
  ContentVariant,
  Icon,
  IconName,
  IconSize,
  ListItem,
  TextColor,
} from '@metamask/design-system-react';

type PermissionListItemProps = {
  /**
   * The total number of permissions
   */
  total: number;
  /**
   * The name of the permission group
   */
  permissionGroupName: string;
  /**
   * The function to call when the asset is clicked
   */
  onClick: () => void;
};

export const PermissionListItem = ({
  total,
  permissionGroupName,
  onClick,
}: PermissionListItemProps) => {
  return (
    <ListItem
      variant={ContentVariant.OneLine}
      isInteractive
      onClick={onClick}
      className="hover:bg-background-default-hover"
      data-testid="permission-list-item"
      title={permissionGroupName}
      value={total}
      valueProps={{ color: TextColor.TextAlternative }}
      valueEndAccessory={
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Sm}
          className="text-icon-alternative"
        />
      }
    />
  );
};
