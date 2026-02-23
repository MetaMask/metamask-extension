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
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';

const VARIANT_CONFIG = {
  [TrustSignalDisplayState.Warning]: {
    iconColor: IconColor.WarningDefault,
    textColor: TextColor.WarningDefault,
    backgroundColor: BoxBackgroundColor.WarningMuted,
    titleKey: 'trustSignalWarningTitle',
    descriptionKey: 'trustSignalWarningDescription',
    buttonStyle: { backgroundColor: 'var(--color-warning-default)' },
    isDanger: false,
    testId: 'trust-signal-warning-modal',
  },
  [TrustSignalDisplayState.Malicious]: {
    iconColor: IconColor.ErrorDefault,
    textColor: TextColor.ErrorDefault,
    backgroundColor: BoxBackgroundColor.ErrorMuted,
    titleKey: 'trustSignalBlockTitle',
    descriptionKey: 'trustSignalBlockDescription',
    buttonStyle: undefined,
    isDanger: true,
    testId: 'trust-signal-block-modal',
  },
} as const;

type TrustSignalModalProps = {
  origin: string;
  state: TrustSignalDisplayState.Warning | TrustSignalDisplayState.Malicious;
  onContinue: () => void;
};

export function TrustSignalModal({
  origin,
  state,
  onContinue,
}: TrustSignalModalProps) {
  const t = useI18nContext();
  const config = VARIANT_CONFIG[state];

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  return (
    <Box
      data-testid={config.testId}
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      padding={4}
      paddingTop={6}
      gap={4}
    >
      <Icon
        name={IconName.Danger}
        size={IconSize.Xl}
        color={config.iconColor}
      />
      <Text variant={TextVariant.HeadingMd} textAlign={TextAlign.Center}>
        {t(config.titleKey)}
      </Text>
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={1}
        className="flex"
      >
        <Text
          variant={TextVariant.BodyMd}
          color={config.textColor}
          textAlign={TextAlign.Center}
        >
          {hostname}
        </Text>
        <Icon
          name={IconName.Danger}
          size={IconSize.Sm}
          color={config.iconColor}
        />
      </Box>
      <Box
        backgroundColor={config.backgroundColor}
        className="rounded-lg"
        padding={4}
      >
        <Text variant={TextVariant.BodyMd}>
          {t(config.descriptionKey)}
        </Text>
      </Box>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        className="w-full"
        onClick={onContinue}
        data-testid={`${config.testId}-continue`}
        isDanger={config.isDanger}
        {...(config.buttonStyle ? { style: config.buttonStyle } : {})}
      >
        {t('trustSignalContinueAnyway')}
      </Button>
    </Box>
  );
}
