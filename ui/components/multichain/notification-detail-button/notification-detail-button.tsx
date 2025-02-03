import React, { useContext, useState } from 'react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Button,
  ButtonVariant,
  ButtonSize,
  IconName,
} from '../../component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import { TRIGGER_TYPES } from '../../../pages/notifications/notification-components';
import useSnapNavigation from '../../../hooks/snaps/useSnapNavigation';
import { type Notification } from '../../../pages/notifications/notification-components/types/notifications/notifications';
import SnapLinkWarning from '../../app/snaps/snap-link-warning';

type NotificationDetailButtonProps = {
  notification: Notification;
  variant: ButtonVariant;
  text: string;
  href: string;
  id: string;
  isExternal?: boolean;
  endIconName?: boolean;
};

export const NotificationDetailButton = ({
  notification,
  variant = ButtonVariant.Secondary,
  text,
  href,
  id,
  isExternal = false,
  endIconName = true,
}: NotificationDetailButtonProps) => {
  const trackEvent = useContext(MetaMetricsContext);
  const { navigate } = useSnapNavigation();
  const isMetaMaskUrl = href.startsWith('metamask:');
  const [isOpen, setIsOpen] = useState(false);

  const isSnapNotification = notification.type === TRIGGER_TYPES.SNAP;

  const handleModalClose = () => {
    setIsOpen(false);
  };

  // this logic can be expanded once this detail button is used outside of the current use cases
  const getClickedItem = () => {
    if (notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT) {
      return 'block_explorer';
    }
    return isExternal ? 'external_link' : 'internal_link';
  };

  const onClick = () => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationDetailClicked,
      properties: {
        notification_id: notification.id,
        notification_type: notification.type,
        ...('chain_id' in notification && {
          chain_id: notification.chain_id,
        }),
        clicked_item: getClickedItem(),
      },
    });

    if (isSnapNotification) {
      if (isMetaMaskUrl) {
        navigate(href);
      } else {
        setIsOpen(true);
      }
    }
  };

  return (
    <>
      {isSnapNotification && (
        <SnapLinkWarning
          isOpen={isOpen}
          onClose={handleModalClose}
          url={href}
        />
      )}
      <Button
        key={id}
        href={!isSnapNotification && href ? href : undefined}
        variant={variant}
        externalLink={isExternal || !isMetaMaskUrl}
        size={ButtonSize.Lg}
        width={BlockSize.Full}
        endIconName={endIconName ? IconName.Arrow2UpRight : undefined}
        onClick={onClick}
      >
        {text}
      </Button>
    </>
  );
};
