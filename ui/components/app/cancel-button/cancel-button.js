import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function CancelButton({ cancelTransaction, ...props }) {
  const t = useI18nContext();

  return (
    <Button
      onClick={cancelTransaction}
      variant={ButtonVariant.Secondary}
      data-testid="cancel-button"
      {...props}
    >
      {t('cancel')}
    </Button>
  );
}

CancelButton.propTypes = {
  cancelTransaction: PropTypes.func,
};
