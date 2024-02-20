import React from 'react';
import { useSelector } from 'react-redux';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';

const Footer = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

  return (
    <PageFooter>
      <Button
        block
        data-testid="confirm-footer-cancel-button"
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
      >
        {t('cancel')}
      </Button>
      <Button
        size={ButtonSize.Lg}
        block
        data-testid="confirm-footer-confirm-button"
        disabled={currentConfirmation?.isScrollToBottomNeeded}
      >
        {t('confirm')}
      </Button>
    </PageFooter>
  );
};

export default Footer;
