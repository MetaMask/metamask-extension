import React from 'react';
import {
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconName,
  Icon,
  IconSize,
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
    <button
      type="button"
      onClick={onClick}
      className="block w-full hover:bg-background-default-hover"
      data-testid="permission-list-item"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingVertical={3}
        paddingHorizontal={4}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {permissionGroupName}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            {total}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        </Box>
      </Box>
    </button>
  );
};
