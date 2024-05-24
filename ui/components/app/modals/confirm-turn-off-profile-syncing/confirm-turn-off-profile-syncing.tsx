import React, { useContext } from 'react';
import { useModalProps } from '../../../../hooks/useModalProps';
import {
  ButtonSize,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  Text,
  ModalFooter,
} from '../../../component-library';
import {
  AlignItems,
  FlexDirection,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../contexts/i18n';

export default function ConfirmTurnOffProfileSyncing() {
  const { props, hideModal } = useModalProps();
  const { turnOffProfileSyncing } = props;
  const t = useContext(I18nContext);

  const handleHideModal = () => {
    hideModal();
  };

  const handleTurnOffProfileSyncing = async () => {
    turnOffProfileSyncing();
    hideModal();
  };

  return (
    <Modal isOpen onClose={handleHideModal} data-testid="turn-off-sync-modal">
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md} data-testid="modal-content">
        <ModalHeader onClose={handleHideModal} data-testid="modal-header">
          {t('areYouSure')}
        </ModalHeader>
        <ModalBody data-testid="modal-body">
          <Text
            textAlign={TextAlign.Center}
            as="p"
            data-testid="confirmation-text"
          >
            {t('profileSyncConfirmation')}
          </Text>
        </ModalBody>
        <ModalFooter
          paddingTop={4}
          onSubmit={handleHideModal}
          onCancel={handleTurnOffProfileSyncing}
          containerProps={{
            flexDirection: FlexDirection.Row,
            alignItems: AlignItems.stretch,
          }}
          submitButtonProps={{
            children: t('cancel'),
            size: ButtonSize.Lg,
            'data-testid': 'cancel-button',
          }}
          cancelButtonProps={{
            children: t('turnOff'),
            size: ButtonSize.Lg,
            'data-testid': 'submit-button',
          }}
          data-testid="modal-footer"
        />
      </ModalContent>
    </Modal>
  );
}
