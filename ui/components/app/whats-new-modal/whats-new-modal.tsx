import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  ModalBodyProps,
  ModalComponent,
  ModalFooterProps,
  ModalHeaderProps,
} from '../../../../shared/notifications';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { getSortedAnnouncementsToShow } from '../../../selectors';
import { updateViewedNotifications } from '../../../store/actions';
import { Modal, ModalContent, ModalOverlay } from '../../component-library';
import { CreateSolanaAccountModal } from '../../multichain/create-solana-account-modal';
import { getTranslatedUINotifications } from './notifications';

type WhatsNewModalProps = {
  onClose: () => void;
};

type NotificationType = {
  id: number;
  date?: string | null;
  title: string;
  description?: string | string[];
  image?: {
    src: string;
    width?: string;
    height?: string;
  };
  modal?: {
    header?: ModalComponent<ModalHeaderProps>;
    body?: ModalComponent<ModalBodyProps>;
    footer?: ModalComponent<ModalFooterProps>;
  };
};

type RenderNotificationProps = {
  notification: NotificationType;
  onClose: () => void;
  onNotificationViewed: (id: number) => Promise<void>;
  onCreateSolanaAccount: () => void;
};

const renderNotification = ({
  notification,
  onClose,
  onNotificationViewed,
  onCreateSolanaAccount,
}: RenderNotificationProps) => {
  const { id, title, image, modal } = notification;

  const handleNotificationClose = async () => {
    await onNotificationViewed(id);
    onClose();
  };

  return (
    <ModalContent
      modalDialogProps={{
        display: Display.Flex,
        flexDirection: FlexDirection.Column,
        padding: 4,
      }}
    >
      {modal?.header && (
        <modal.header.component onClose={onClose} image={image} />
      )}
      {modal?.body && <modal.body.component title={title} />}
      {modal?.footer && (
        <modal.footer.component
          onAction={onCreateSolanaAccount}
          onCancel={handleNotificationClose}
        />
      )}
    </ModalContent>
  );
};

export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const [showCreateSolanaAccountModal, setShowCreateSolanaAccountModal] =
    useState(false);

  const notifications = useSelector(getSortedAnnouncementsToShow);

  const handleNotificationViewed = async (id: number) => {
    await updateViewedNotifications({ [id]: true });
  };

  const handleModalClose = async () => {
    await Promise.all(
      notifications.map(({ id }) => handleNotificationViewed(id)),
    );
    trackEvent({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.WhatsNewViewed,
    });
    onClose();
  };

  const handleCreateSolanaAccount = () => {
    setShowCreateSolanaAccountModal(true);
  };

  return (
    <>
      <Modal
        onClose={handleModalClose}
        data-testid="whats-new-modal"
        isOpen={notifications.length > 0 && !showCreateSolanaAccountModal}
        isClosedOnOutsideClick
        isClosedOnEscapeKey
        autoFocus={false}
      >
        <ModalOverlay />

        {notifications.map(({ id }) => {
          const notification = getTranslatedUINotifications(t)[id];

          return renderNotification({
            notification,
            onClose,
            onNotificationViewed: handleNotificationViewed,
            onCreateSolanaAccount: handleCreateSolanaAccount,
          });
        })}
      </Modal>
      {showCreateSolanaAccountModal && (
        <CreateSolanaAccountModal
          onClose={() => {
            setShowCreateSolanaAccountModal(false);
            handleModalClose();
          }}
        />
      )}
    </>
  );
}
