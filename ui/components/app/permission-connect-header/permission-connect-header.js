import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  JustifyContent,
  TextColor,
  TextVariant,
  Display,
  BlockSize,
  FontWeight,
  FlexDirection,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  IconSize,
  Text,
  Box,
  AvatarFavicon,
  AvatarBase,
} from '../../component-library';

const PermissionConnectHeader = ({ title, origin, iconUrl }) => {
  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      alignItems={AlignItems.center}
      display={Display.Flex}
      padding={4}
      style={{
        boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
      }}
    >
      <Box>
        {iconUrl ? (
          <AvatarFavicon
            backgroundColor={BackgroundColor.backgroundAlternative}
            size={IconSize.Lg}
            src={iconUrl}
            name={title}
          />
        ) : (
          <AvatarBase
            size={IconSize.Lg}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            color={TextColor.textAlternative}
            style={{ borderWidth: '0px' }}
            backgroundColor={BackgroundColor.backgroundAlternative}
          >
            {title?.match(/[a-z0-9]/iu)?.[0] ?? '?'}
          </AvatarBase>
        )}
      </Box>
      <Box
        marginLeft={4}
        marginRight={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ overflow: 'hidden' }}
      >
        <Text ellipsis fontWeight={FontWeight.Medium}>
          {title}
        </Text>
        <Text
          ellipsis
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          {origin}
        </Text>
      </Box>
    </Box>
  );
};

PermissionConnectHeader.propTypes = {
  title: PropTypes.string,
  origin: PropTypes.string,
  iconUrl: PropTypes.string,
};

export default PermissionConnectHeader;
