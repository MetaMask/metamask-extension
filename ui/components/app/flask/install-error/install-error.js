import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box/box';
import {
  AlignItems,
  BLOCK_SIZES,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import ActionableMessage from '../../../ui/actionable-message/actionable-message';
import { Text } from '../../../component-library';

const InstallError = ({ title, error }) => {
  return (
    <Box
      flexDirection={FLEX_DIRECTION.COLUMN}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BLOCK_SIZES.FULL}
      padding={2}
    >
      <Text fontWeight={FONT_WEIGHT.BOLD} variant={TextVariant.headingLg}>
        {title}
      </Text>
      <Box padding={2}>
        <ActionableMessage type="danger" message={error} />
      </Box>
    </Box>
  );
};

InstallError.propTypes = {
  title: PropTypes.node.isRequired,
  error: PropTypes.string.isRequired,
};

export default InstallError;
