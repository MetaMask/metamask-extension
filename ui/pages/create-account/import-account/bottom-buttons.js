import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ButtonPrimary,
  ButtonSecondary,
} from '../../../components/component-library';
import Box from '../../../components/ui/box/box';
import {
  BLOCK_SIZES,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';

BottomButtons.propTypes = {
  importAccountFunc: PropTypes.func.isRequired,
  isPrimaryDisabled: PropTypes.bool.isRequired,
};

export default function BottomButtons({
  importAccountFunc,
  isPrimaryDisabled,
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const warning = useSelector((state) => state.appState.warning);

  return (
    <Box
      justifyContent={JustifyContent.spaceBetween}
      marginTop={warning ? 0 : 8} // These buttons need a margin on the top only if there's no warning message
    >
      <ButtonSecondary
        width={BLOCK_SIZES.FIVE_TWELFTHS}
        onClick={() => {
          dispatch(actions.hideWarning());
          window.history.back();
        }}
      >
        {t('cancel')}
      </ButtonSecondary>
      <ButtonPrimary
        width={BLOCK_SIZES.FIVE_TWELFTHS}
        onClick={importAccountFunc}
        disabled={isPrimaryDisabled}
      >
        {t('import')}
      </ButtonPrimary>
    </Box>
  );
}
