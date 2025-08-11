import React, { useContext } from 'react';
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
};

const renderNotification = ({
  notification,
  onClose,
  onNotificationViewed,
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
          onAction={() => {
            // No action needed for whats-new notifications
            // This is required by the ModalFooterProps type
            console.log('No action needed for now');
          }}
          onCancel={handleNotificationClose}
        />
      )}
    </ModalContent>
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

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

  return (
    <>
      <Modal
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClose={handleModalClose}
        data-testid="whats-new-modal"
        isOpen={notifications.length > 0}
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
          });
        })}
      </Modal>
    </>
  );
}
