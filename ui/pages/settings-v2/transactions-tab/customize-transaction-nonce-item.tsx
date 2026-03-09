import React from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const CustomizeTransactionNonceItem = () => {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={1} paddingVertical={3}>
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {t('customizeTransactionNonce')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('customizeTransactionNonceDescription')}
      </Text>
    </Box>
  );
};
