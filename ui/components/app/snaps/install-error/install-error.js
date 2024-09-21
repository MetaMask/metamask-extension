import React from 'react';
import PropTypes from 'prop-types';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
  FlexDirection,
  Display,
  Severity,
} from '../../../../helpers/constants/design-system';

import {
  AvatarIcon,
  AvatarIconSize,
  Text,
  Box,
  BannerAlert,
} from '../../../component-library';

const InstallError = ({ title, error, description, iconName }) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BlockSize.Full}
      padding={2}
    >
      {iconName && (
        <AvatarIcon
          iconName={iconName}
          size={AvatarIconSize.Xl}
          color={IconColor.errorDefault}
          backgroundColor={BackgroundColor.errorMuted}
          marginBottom={4}
        />
      )}
      <Text variant={TextVariant.headingLg}>{title}</Text>
      {description && <Text textAlign={TextAlign.Center}>{description}</Text>}
      {error && (
        <BannerAlert
          marginTop={4}
          startAccessory={null}
          severity={Severity.Danger}
        >
          <Text variant={TextVariant.bodySm}>{error}</Text>
        </BannerAlert>
      )}
    </Box>
  );
};

InstallError.propTypes = {
  title: PropTypes.node.isRequired,
  error: PropTypes.string,
  description: PropTypes.string,
  iconName: PropTypes.string,
};

export default InstallError;
