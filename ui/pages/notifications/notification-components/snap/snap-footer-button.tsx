import { useCallback, useContext, useState } from 'react';
import useSnapNavigation from '../../../../hooks/snaps/useSnapNavigation';
import { DetailedViewData, SnapNotification } from './types';
import SnapLinkWarning from '../../../../components/app/snaps/snap-link-warning';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';

export const SnapFooterButton = (props: { notification: SnapNotification }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const { navigate } = useSnapNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const detailedView = props.notification.data as DetailedViewData;
  const footer = detailedView?.detailedView?.footerLink;

  const handleModalClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (!footer) {
    return null;
  }

  const href = footer.href;
  const text = footer.text;
  const isMetaMaskUrl = href.startsWith('metamask:');
  const isExternal = !isMetaMaskUrl;
  const onClick = useCallback(() => {
    // Analytics
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationDetailClicked,
      properties: {
        notification_id: props.notification.id,
        notification_type: props.notification.type,
        clicked_item: isExternal ? 'external_link' : 'internal_link',
      },
    });

    // Warning / Navigation
    if (isExternal) {
      setIsOpen(true);
    } else {
      navigate(href);
    }
  }, []);

  return (
    <>
      <SnapLinkWarning isOpen={isOpen} onClose={handleModalClose} url={href} />
      <NotificationDetailButton
        variant={ButtonVariant.Secondary}
        isExternal={isExternal}
        text={text}
        onClick={onClick}
      />
    </>
  );
};
