import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useModalProps } from '../../../../hooks/useModalProps';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { useDisableProfileSyncing } from '../../../../hooks/metamask-notifications/useProfileSyncing';
import { selectParticipateInMetaMetrics } from '../../../../selectors/metamask-notifications/authentication';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
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
  const { hideModal } = useModalProps();
  const { disableProfileSyncing } = useDisableProfileSyncing();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const participateInMetaMetrics = useSelector(selectParticipateInMetaMetrics);

  const handleCancel = () => {
    hideModal();
  };

  const handleTurnOffProfileSyncing = async () => {
    await disableProfileSyncing();

    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event:
        MetaMetricsEventName.OnboardingWalletAdvancedSettingsTurnOffProfileSyncing,
      properties: {
        participateInMetaMetrics,
      },
    });

    hideModal();
  };

  return (
    <Modal isOpen onClose={hideModal} data-testid="turn-off-sync-modal">
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md} data-testid="modal-content">
        <ModalHeader onClose={hideModal} data-testid="modal-header">
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
          onSubmit={handleTurnOffProfileSyncing}
          onCancel={handleCancel}
          containerProps={{
            flexDirection: FlexDirection.Row,
            alignItems: AlignItems.stretch,
          }}
          submitButtonProps={{
            children: t('turnOff'),
            size: ButtonSize.Lg,
            'data-testid': 'submit-button',
          }}
          cancelButtonProps={{
            children: t('cancel'),
            size: ButtonSize.Lg,
            'data-testid': 'cancel-button',
          }}
          data-testid="modal-footer"
        />
      </ModalContent>
    </Modal>
  );
}
