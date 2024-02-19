import React from 'react';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const Footer = () => {
  const t = useI18nContext();
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
      >
        {t('confirm')}
      </Button>
    </PageFooter>
  );
};

export default Footer;
