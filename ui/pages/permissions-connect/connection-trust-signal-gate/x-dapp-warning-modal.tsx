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
} from '../../../components/component-library';

type XDappWarningModalProps = Readonly<{
  onContinue: () => void;
  onCancel: () => void;
}>;

export function XDappWarningModal({
  onContinue,
  onCancel,
}: XDappWarningModalProps) {
  const t = useI18nContext();

  return (
    <Modal isOpen onClose={onCancel} data-testid="x-dapp-warning-modal">
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
            color={IconColor.WarningDefault}
          />
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {t('xDappConnectionWarning')}
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
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onCancel}
            data-testid="x-dapp-warning-modal-back"
          >
            {t('backToSafety')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onContinue}
            data-testid="x-dapp-warning-modal-continue"
          >
            {t('continueAnyway')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
