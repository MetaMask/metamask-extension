import React from 'react';
import PropTypes from 'prop-types';
import {
  BLOCK_SIZES,
  FLEX_DIRECTION,
  DISPLAY,
  AlignItems,
  Color,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Label, TEXT_FIELD_TYPES, TextField } from '../../../component-library';

const PasswordInput = ({ setPassword }) => {
  const t = useI18nContext();

  return (
    <Box
      width={BLOCK_SIZES.FULL}
      flexDirection={FLEX_DIRECTION.COLUMN}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexStart}
      paddingLeft={5}
      paddingRight={5}
    >
      <Label
        color={Color.textDefault}
        marginBottom={2}
        variant={TextVariant.bodySm}
      >
        {t('typePassword')}
      </Label>
      <TextField
        width={BLOCK_SIZES.FULL}
        placeholder={t('enterPassword')}
        type={TEXT_FIELD_TYPES.PASSWORD}
        className="export-private-key-modal__password-input"
        onChange={(event) => setPassword(event.target.value)}
        data-testid="password-input"
      />
    </Box>
  );
};

PasswordInput.propTypes = {
  setPassword: PropTypes.func.isRequired,
};

export default PasswordInput;
