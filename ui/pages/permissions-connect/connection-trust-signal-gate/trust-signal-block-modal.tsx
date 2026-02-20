import React, { useState } from 'react';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  Checkbox,
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

type TrustSignalBlockModalProps = {
  origin: string;
  onContinue: () => void;
  onGoBack: () => void;
};

export function TrustSignalBlockModal({
  origin,
  onContinue,
  onGoBack,
}: TrustSignalBlockModalProps) {
  const t = useI18nContext();
  const [accepted, setAccepted] = useState(false);

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  return (
    <Box
      data-testid="trust-signal-block-modal"
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
        color={IconColor.errorDefault}
      />
      <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
        {t('trustSignalBlockTitle')}
      </Text>
      <Text
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.Center}
        data-testid="trust-signal-block-hostname"
      >
        {hostname}
      </Text>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {t('trustSignalBlockDescription')}
      </Text>
      <Checkbox
        data-testid="trust-signal-block-checkbox"
        isChecked={accepted}
        onChange={() => setAccepted((prev) => !prev)}
        label={t('trustSignalBlockCheckbox')}
      />
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
          data-testid="trust-signal-block-go-back"
        >
          {t('trustSignalGoBack')}
        </Button>
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onContinue}
          disabled={!accepted}
          data-testid="trust-signal-block-continue"
        >
          {t('trustSignalContinueAnyway')}
        </Button>
      </Box>
    </Box>
  );
}
