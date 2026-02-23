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
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

type TrustSignalWarningModalProps = {
  origin: string;
  onContinue: () => void;
};

export function TrustSignalWarningModal({
  origin,
  onContinue,
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
      padding={4}
      paddingTop={6}
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
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={1}
      >
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.warningDefault}
          textAlign={TextAlign.Center}
        >
          {hostname}
        </Text>
        <Icon
          name={IconName.Danger}
          size={IconSize.Sm}
          color={IconColor.warningDefault}
        />
      </Box>
      <Box
        backgroundColor={BackgroundColor.warningMuted}
        borderRadius={BorderRadius.LG}
        padding={4}
        width={BlockSize.Full}
      >
        <Text variant={TextVariant.bodyMd}>
          {t('trustSignalWarningDescription')}
        </Text>
      </Box>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        width={BlockSize.Full}
        onClick={onContinue}
        data-testid="trust-signal-warning-continue"
        style={{ backgroundColor: 'var(--color-warning-default)' }}
      >
        {t('trustSignalContinueAnyway')}
      </Button>
    </Box>
  );
}
