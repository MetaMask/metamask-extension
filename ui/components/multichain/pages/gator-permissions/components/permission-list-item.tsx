import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';

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
    <Box
      data-testid="permission-list-item"
      as="button"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      padding={4}
      gap={4}
      className="multichain-permission-list-item"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={2}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left} ellipsis>
          {permissionGroupName}
        </Text>
      </Box>

      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={2}
      >
        <Text
          as="span"
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {total}
        </Text>
        <Icon
          display={Display.Flex}
          name={IconName.ArrowRight}
          color={IconColor.iconDefault}
          size={IconSize.Sm}
          backgroundColor={BackgroundColor.backgroundDefault}
        />
      </Box>
    </Box>
  );
};
