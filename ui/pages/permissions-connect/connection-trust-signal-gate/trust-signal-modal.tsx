import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
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

type TrustSignalModalProps = {
  origin: string;
  onContinue: () => void;
};

export function TrustSignalModal({
  origin,
  onContinue,
}: TrustSignalModalProps) {
  const t = useI18nContext();

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  return (
    <Box
      data-testid="trust-signal-block-modal"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      padding={4}
      paddingTop={6}
      gap={4}
    >
      <Icon
        name={IconName.Danger}
        size={IconSize.Xl}
        color={IconColor.ErrorDefault}
      />
      <Text variant={TextVariant.HeadingMd} textAlign={TextAlign.Center}>
        {t('trustSignalBlockTitle')}
      </Text>
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={1}
        className="flex"
      >
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.ErrorDefault}
          textAlign={TextAlign.Center}
        >
          {hostname}
        </Text>
        <Icon
          name={IconName.Danger}
          size={IconSize.Sm}
          color={IconColor.ErrorDefault}
        />
      </Box>
      <Box
        backgroundColor={BoxBackgroundColor.ErrorMuted}
        className="rounded-lg"
        padding={4}
      >
        <Text variant={TextVariant.BodyMd}>
          {t('trustSignalBlockDescription')}
        </Text>
      </Box>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        className="w-full"
        onClick={onContinue}
        data-testid="trust-signal-block-modal-continue"
        isDanger
      >
        {t('trustSignalContinueAnyway')}
      </Button>
    </Box>
  );
}
