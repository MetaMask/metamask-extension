import React from 'react';
import PropTypes from 'prop-types';
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

export const PermissionsCellConnectionListItem = ({
  title,
  iconName,
  count,
  networks,
  countMessage,
  paddingTopValue,
  paddingBottomValue,
  onClick,
}) => {
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

PermissionsCellConnectionListItem.propTypes = {
  title: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  networks: PropTypes.array.isRequired,
  countMessage: PropTypes.string.isRequired,
  paddingTopValue: PropTypes.number.isRequired,
  paddingBottomValue: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
};
