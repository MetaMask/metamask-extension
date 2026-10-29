import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';

type TrustSignalModalProps = Readonly<{
  onContinue: () => void;
  onCancel: () => void;
}>;

export function TrustSignalModal({
  onContinue,
  onCancel,
}: TrustSignalModalProps) {
  const t = useI18nContext();

  return (
    <Modal isOpen onClose={onCancel} data-testid="trust-signal-block-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onCancel} startAccessory={<span />} />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={4}
          paddingTop={2}
          paddingBottom={6}
          paddingLeft={4}
          paddingRight={4}
        >
          <Icon
            name={IconName.Warning}
            size={IconSize.Xl}
            color={IconColor.ErrorDefault}
          />
          <Text variant={TextVariant.HeadingLg}>
            {t('continueAtYourOwnRisk')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Left}
          >
            {t('trustSignalPhishingWarning')}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
        >
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onContinue}
            data-testid="trust-signal-block-modal-continue"
            isDanger
          >
            {t('connectAnyway')}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onCancel}
            data-testid="trust-signal-block-modal-cancel"
          >
            {t('cancel')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
