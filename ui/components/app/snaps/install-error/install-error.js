import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box/box';
import {
  AlignItems,
  BackgroundColor,
  BLOCK_SIZES,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import ActionableMessage from '../../../ui/actionable-message/actionable-message';
import { AvatarIcon, IconSize, Text } from '../../../component-library';

const InstallError = ({ title, error, description, iconName }) => {
  return (
    <Box
      flexDirection={FLEX_DIRECTION.COLUMN}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BLOCK_SIZES.FULL}
      padding={2}
    >
      {iconName && (
        <AvatarIcon
          iconName={iconName}
          size={IconSize.Xl}
          iconProps={{
            size: IconSize.Xl,
          }}
          color={IconColor.errorDefault}
          backgroundColor={BackgroundColor.errorMuted}
          marginBottom={4}
        />
      )}
      <Text fontWeight={FONT_WEIGHT.BOLD} variant={TextVariant.headingLg}>
        {title}
      </Text>
      {description && <Text textAlign={TextAlign.Center}>{description}</Text>}
      {error && (
        <Box padding={2}>
          <ActionableMessage type="danger" message={error} />
        </Box>
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
