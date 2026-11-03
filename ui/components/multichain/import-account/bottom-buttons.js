import PropTypes from 'prop-types';
import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { Box } from '../../component-library';
import { Display } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function BottomButtons({
  importAccountFunc,
  isPrimaryDisabled,
  onActionComplete,
}) {
  const t = useI18nContext();

  return (
    <Box display={Display.Flex} gap={4}>
      <Button
        onClick={() => {
          onActionComplete();
        }}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
        isFullWidth
      >
        {t('cancel')}
      </Button>
      <Button
        onClick={async () => {
          try {
            const result = await importAccountFunc();
            if (result) {
              onActionComplete(true);
            }
          } catch (e) {
            // Take no action
          }
        }}
        isDisabled={isPrimaryDisabled}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        data-testid="import-account-confirm-button"
        isFullWidth
      >
        {t('import')}
      </Button>
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
