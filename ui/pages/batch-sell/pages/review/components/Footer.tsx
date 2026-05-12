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
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export const Footer = () => {
  const t = useI18nContext();

  return (
    <Box padding={4}>
      <Button
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        isFullWidth
        onClick={console.log}
        disabled={false}
      >
        <Text
          variant={TextVariant.ButtonLabelMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          color={TextColor.PrimaryInverse}
        >
          {t('review')}
        </Text>
      </Button>
    </Box>
  );
};
