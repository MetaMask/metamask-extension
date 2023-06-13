import React from 'react';
import {
  AlignItems,
  TextVariant,
  FlexDirection,
  JustifyContent,
  Display,
  TextAlign,
} from '../../../helpers/constants/design-system';
import {
  Text,
  Button,
  BUTTON_VARIANT,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Box,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function AddSnapAccountModa({
  onClose,
  isOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useI18nContext();

  return (
    <Modal className="add-snap-account-popup" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose} margin={[4, 4, 4, 4]}>
          {t('addSnapAccountPopupTitle')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          padding={[4, 4, 4, 4]}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Box marginBottom={4}>
            <img src="/images/add-snaps-image.svg" />
          </Box>
          <Text
            variant={TextVariant.bodyLgMedium}
            textAlign={TextAlign.Center}
            marginBottom={4}
          >
            {t('addSnapAccountPopupDescription')}
          </Text>
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            block
            className="get-started_button"
            data-testid="get-started-button"
          >
            {t('getStarted')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
