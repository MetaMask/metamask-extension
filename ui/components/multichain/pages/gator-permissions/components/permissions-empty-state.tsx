import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
} from '@metamask/design-system-react';
import { useTheme } from '../../../../../hooks/useTheme';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ThemeType } from '../../../../../../shared/constants/preferences';

export const PermissionsEmptyState = () => {
  const t = useI18nContext();
  const theme = useTheme();

  const descriptionText = t('permissionsPageEmptyDescription');
  const imageSrc =
    theme === ThemeType.dark
      ? '/images/empty-state-permissions-dark.png'
      : '/images/empty-state-permissions-light.png';

  return (
    <Box
      data-testid="permissions-empty-state"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      gap={3}
      className="max-w-64 mx-auto pb-12"
    >
      <img src={imageSrc} alt={descriptionText} width={72} height={72} />
      <Text variant={TextVariant.BodyLg} fontWeight={FontWeight.Medium}>
        {t('permissionsPageEmptyTitle')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        textAlign={TextAlign.Center}
      >
        {descriptionText}
      </Text>
    </Box>
  );
};
