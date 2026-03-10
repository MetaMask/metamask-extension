import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  ButtonSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const EMPTY_CONTACTS_IMAGE_SRC = './images/empty-contacts.svg';

export function ContactsEmptyState({
  onAddContact,
}: {
  onAddContact: () => void;
}) {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      padding={6}
      paddingBottom={0}
      paddingTop={0}
      gap={6}
      className="flex flex-col items-center justify-center"
      data-testid="contacts-empty-state"
    >
      <img
        src={EMPTY_CONTACTS_IMAGE_SRC}
        alt=""
        width={72}
        height={72}
        className="flex-shrink-0"
      />
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={4}
        className="flex max-w-[218px] flex-col items-center"
      >
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          {t('addFriendsAndAddresses')}
        </Text>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={onAddContact}
          data-testid="contacts-add-contact-button"
          className="max-w-[218px]"
        >
          {t('addContact')}
        </Button>
      </Box>
    </Box>
  );
}
