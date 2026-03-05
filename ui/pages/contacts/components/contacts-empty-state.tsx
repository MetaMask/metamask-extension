import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export function ContactsEmptyState() {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      padding={6}
      gap={6}
      className="flex w-full flex-col items-center justify-center py-12"
      data-testid="contacts-empty-state"
    >
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        padding={4}
        className="flex rounded-full"
      >
        <Icon
          name={IconName.People}
          size={IconSize.Xl}
          color={IconColor.IconAlternative}
        />
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="flex max-w-64 flex-col items-center"
      >
        <Text
          variant={TextVariant.HeadingMd}
          color={TextColor.TextDefault}
          textAlign={TextAlign.Center}
        >
          {t('buildContactList')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          {t('addFriendsAndAddresses')}
        </Text>
      </Box>
    </Box>
  );
}
