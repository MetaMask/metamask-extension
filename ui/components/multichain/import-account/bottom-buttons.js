import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../component-library';
import { Display } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import * as actions from '../../../store/actions';

export default function BottomButtons({
  importAccountFunc,
  isPrimaryDisabled,
  onActionComplete,
}) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <Box display={Display.Flex} gap={4}>
      <ButtonSecondary
        onClick={() => {
          dispatch(actions.hideWarning());
          onActionComplete();
        }}
        size={ButtonSecondarySize.Lg}
        block
      >
        {t('cancel')}
      </ButtonSecondary>
      <ButtonPrimary
        onClick={async () => {
          try {
            const result = await importAccountFunc();
            if (result) {
              onActionComplete(true);
            }
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
          // eslint-disable-next-line id-length
          } catch (e) {
            // Take no action
          }
        }}
        disabled={isPrimaryDisabled}
        size={ButtonSecondarySize.Lg}
        data-testid="import-account-confirm-button"
        block
      >
        {t('import')}
      </ButtonPrimary>
    </Box>
  );
}

BottomButtons.propTypes = {
  /**
   * Function to import the account
   */
  importAccountFunc: PropTypes.func.isRequired,
  /**
   * Represents if the action button is disabled
   */
  isPrimaryDisabled: PropTypes.bool.isRequired,
  /**
   * Executes when the primary action is complete
   */
  onActionComplete: PropTypes.func.isRequired,
};
