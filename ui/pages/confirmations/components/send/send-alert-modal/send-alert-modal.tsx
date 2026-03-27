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
import { JustifyContent } from '../../../../../helpers/constants/design-system';
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
        <ModalHeader
          onClose={onClose}
          paddingBottom={0}
          justifyContent={JustifyContent.flexEnd}
          closeButtonProps={{
            'data-testid': 'send-alert-modal-close-button',
          }}
        />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          className="pb-2"
        >
          <Icon
            name={IconName.Danger}
            size={IconSize.Xl}
            color={IconColor.WarningDefault}
          />
          <Text
            variant={TextVariant.HeadingSm}
            textAlign={TextAlign.Center}
            className="mt-2"
          >
            {title}
          </Text>
        </Box>
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
