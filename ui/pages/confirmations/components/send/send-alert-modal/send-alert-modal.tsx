import React from 'react';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextVariant,
  TextAlign,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
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
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          className="pt-4 pb-2"
        >
          <Icon
            name={IconName.Danger}
            size={IconSize.Xl}
            color={IconColor.WarningDefault}
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
            variant={TextVariant.BodyMd}
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
