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

type PermissionsEmptyStateProps = {
  // Optional description text. Defaults to the 'permissionsPageEmptyDescription' i18n key.
  description?: string;
  // Optional test ID for the description element.
  descriptionTestId?: string;
};

export const PermissionsEmptyState = ({
  description,
  descriptionTestId,
}: PermissionsEmptyStateProps) => {
  const t = useI18nContext();
  const theme = useTheme();

  const descriptionText = description ?? t('permissionsPageEmptyDescription');
  const imageSrc =
    theme === ThemeType.dark
      ? '/images/empty-state-permissions-dark.png'
      : '/images/empty-state-permissions-light.png';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      gap={3}
      className="max-w-64 mx-auto pb-12"
    >
      <img src={imageSrc} alt={descriptionText} width={72} height={72} />
      <Text variant={TextVariant.BodyLgMedium} fontWeight={FontWeight.Medium}>
        {t('permissionsPageEmptyTitle')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        textAlign={TextAlign.Center}
        data-testid={descriptionTestId}
      >
        {descriptionText}
      </Text>
    </Box>
  );
};
