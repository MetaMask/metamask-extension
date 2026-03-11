import React from 'react';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SendAlertModalProps } from './send-alert-modal.types';

export const SendAlertModal = ({
  isOpen,
  title,
  errorMessage,
  onAcknowledge,
  onClose,
}: SendAlertModalProps) => {
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid="send-alert-modal">
      <ModalOverlay />
      <ModalContent>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          paddingTop={4}
          paddingBottom={2}
        >
          <Icon
            name={IconName.Danger}
            size={IconSize.Xl}
            color={IconColor.warningDefault}
          />
        </Box>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            'data-testid': 'send-alert-modal-close-button',
          }}
        >
          {title}
        </ModalHeader>
        <ModalBody>
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            data-testid="send-alert-modal-message"
          >
            {errorMessage}
          </Text>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={onAcknowledge}
          submitButtonProps={{
            children: t('iUnderstand'),
            'data-testid': 'send-alert-modal-acknowledge-button',
          }}
          cancelButtonProps={{
            'data-testid': 'send-alert-modal-cancel-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
};
