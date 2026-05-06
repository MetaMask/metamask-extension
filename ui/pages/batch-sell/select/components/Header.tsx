import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const Header = () => {
  const t = useI18nContext();

  return (
    <Box paddingHorizontal={4} paddingVertical={3} gap={1}>
      <Text variant={TextVariant.HeadingLg}>
        {t('batchSellSelectHeaderTitle')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('batchSellSelectHeaderSubtitle')}
      </Text>
    </Box>
  );
};
