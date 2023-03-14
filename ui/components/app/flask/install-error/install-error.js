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
import { useI18nContext } from '../../../../hooks/useI18nContext';

const InstallError = ({ error }) => {
  const t = useI18nContext();
  return (
    <Box
      flexDirection={FLEX_DIRECTION.COLUMN}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BLOCK_SIZES.FULL}
      padding={2}
    >
      <Text fontWeight={FONT_WEIGHT.BOLD} variant={TextVariant.headingLg}>
        {t('snapInstallError')}
      </Text>
      <Box padding={2}>
        <ActionableMessage type="danger" message={error} />
      </Box>
    </Box>
  );
};

InstallError.propTypes = {
  error: PropTypes.string.isRequired,
};

export default InstallError;
