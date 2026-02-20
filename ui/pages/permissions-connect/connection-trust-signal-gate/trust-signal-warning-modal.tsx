import React from 'react';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

type TrustSignalWarningModalProps = {
  origin: string;
  onContinue: () => void;
  onGoBack: () => void;
};

export function TrustSignalWarningModal({
  origin,
  onContinue,
  onGoBack,
}: TrustSignalWarningModalProps) {
  const t = useI18nContext();

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  return (
    <Box
      data-testid="trust-signal-warning-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      padding={4}
      gap={4}
    >
      <Icon
        name={IconName.Danger}
        size={IconSize.Xl}
        color={IconColor.warningDefault}
      />
      <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
        {t('trustSignalWarningTitle')}
      </Text>
      <Text
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.Center}
        data-testid="trust-signal-warning-hostname"
      >
        {hostname}
      </Text>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {t('trustSignalWarningDescription')}
      </Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        width={BlockSize.Full}
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onGoBack}
          data-testid="trust-signal-warning-go-back"
        >
          {t('trustSignalGoBack')}
        </Button>
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onContinue}
          data-testid="trust-signal-warning-continue"
        >
          {t('trustSignalContinueAnyway')}
        </Button>
      </Box>
    </Box>
  );
}
