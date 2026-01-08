import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Button,
  Icon,
  IconSize,
  IconName,
  ModalFooter,
  ModalBody,
  ButtonSize,
} from '../../component-library';

type ConnectionsRemovedModalProps = {
  onConfirm: () => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ConnectionsRemovedModal({
  onConfirm,
}: ConnectionsRemovedModalProps) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      data-testid="connections-removed-modal"
    >
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader>
          <Box>
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <Icon
                name={IconName.Danger}
                size={IconSize.Xl}
                color={IconColor.warningDefault}
              />
            </Box>
            <Text
              variant={TextVariant.headingSm}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {t('connectionsRemovedModalTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>{t('connectionsRemovedModalDescription')}</ModalBody>
        <ModalFooter>
          <Button
            size={ButtonSize.Lg}
            block
            onClick={onConfirm}
            data-testid="connections-removed-modal-button"
          >
            {t('gotIt')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
