import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const Footer = () => {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      gap={4}
      padding={4}
      width={BlockSize.Full}
    >
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
    </Box>
  );
};

export default Footer;
