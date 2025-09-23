import React from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Text,
} from '../../../../component-library';
import { Icon, IconName, IconSize } from '../../../../component-library/icon';
import { PermissionsCellTooltip } from './permissions-cell-tooltip';
import {
  SizeNumber,
  SizeNumberArray,
} from '../../../../component-library/box/box.types';

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
  paddingTopValue: SizeNumber | SizeNumberArray;
  paddingBottomValue: SizeNumber | SizeNumberArray;
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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      gap={4}
      className="multichain-permissions-list-item"
      paddingTop={paddingTopValue}
      paddingBottom={paddingBottomValue}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <AvatarIcon
        marginTop={1}
        iconName={iconName}
        size={AvatarIconSize.Md}
        color={IconColor.iconAlternative}
        backgroundColor={BackgroundColor.backgroundMuted}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ alignSelf: 'center', flexGrow: 1 }}
        gap={1}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left}>
          {title}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
        >
          <Text
            as="span"
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            ellipsis
          >
            {count} {countMessage}
          </Text>
          <PermissionsCellTooltip networks={networks} />
        </Box>
      </Box>
      <Icon
        name={IconName.ArrowRight}
        color={IconColor.iconAlternative}
        size={IconSize.Sm}
      />
    </Box>
  );
};
