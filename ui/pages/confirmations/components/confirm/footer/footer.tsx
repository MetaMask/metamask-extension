import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../selectors';

const Footer = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);

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
        disabled={currentConfirmation?.isScrollToBottomNeeded}
      >
        {t('confirm')}
      </Button>
    </Box>
  );
};

export default Footer;
