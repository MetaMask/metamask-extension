import React from 'react';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  ButtonIconSize,
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

type TrustSignalVerifiedModalProps = {
  origin: string;
  onDismiss: () => void;
};

export function TrustSignalVerifiedModal({
  origin,
  onDismiss,
}: TrustSignalVerifiedModalProps) {
  const t = useI18nContext();

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  return (
    <Box
      data-testid="trust-signal-verified-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      padding={4}
      paddingTop={6}
      gap={4}
      style={{ position: 'relative' }}
    >
      <ButtonIcon
        iconName={IconName.Close}
        size={ButtonIconSize.Sm}
        onClick={onDismiss}
        ariaLabel="Close"
        data-testid="trust-signal-verified-close"
        style={{ position: 'absolute', top: '16px', right: '16px' }}
      />
      <Icon
        name={IconName.Confirmation}
        size={IconSize.Xl}
        color={IconColor.successDefault}
      />
      <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
        {t('trustSignalVerifiedTitle')}
      </Text>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={1}
      >
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.successDefault}
          textAlign={TextAlign.Center}
        >
          {hostname}
        </Text>
        <Icon
          name={IconName.VerifiedFilled}
          size={IconSize.Sm}
          color={IconColor.successDefault}
        />
      </Box>
      <Box
        backgroundColor={BackgroundColor.successMuted}
        borderRadius={BorderRadius.LG}
        padding={4}
        width={BlockSize.Full}
      >
        <Text variant={TextVariant.bodyMd}>
          {t('trustSignalVerifiedDescription')}
        </Text>
      </Box>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        width={BlockSize.Full}
        onClick={onDismiss}
        data-testid="trust-signal-verified-ok"
      >
        {t('ok')}
      </Button>
    </Box>
  );
}
