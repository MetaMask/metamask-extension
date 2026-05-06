import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type FooterProps = {
  onSubmit: () => void;
}

export const Footer = ({ onSubmit }: FooterProps) => {
  const t = useI18nContext()

  return (
    <Box padding={6}>
      <Button
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        isFullWidth
        onClick={onSubmit}
      >
        <Text
          variant={TextVariant.ButtonLabelMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          color={TextColor.PrimaryInverse}
        >{t('next')}</Text>
      </Button>
    </Box>
  );
};
