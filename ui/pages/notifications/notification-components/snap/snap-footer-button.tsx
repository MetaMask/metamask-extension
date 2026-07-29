import React, { useCallback, useState } from 'react';
import useSnapNavigation from '../../../../hooks/snaps/useSnapNavigation';
import SnapLinkWarning from '../../../../components/app/snaps/snap-link-warning';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { getNotificationTypeForAnalytics } from '../../../../helpers/utils/notification.util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { DetailedViewData, SnapNotification } from './types';

export const SnapFooterButton = (props: { notification: SnapNotification }) => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { handleSnapNavigate } = useSnapNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const data = props.notification.data as DetailedViewData;
  const footer = data?.detailedView?.footerLink;

  const handleModalClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onClick = useCallback(
    (href: string, isExternal: boolean) => {
      // Analytics
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NotificationDetailClicked)
          .addCategory(MetaMetricsEventCategory.NotificationInteraction)
          .addProperties({
            /* eslint-disable @typescript-eslint/naming-convention */
            notification_id: props.notification.id,
            notification_type: getNotificationTypeForAnalytics(
              props.notification,
            ),
            notification_subtype: props.notification.notification_subtype,
            clicked_item: isExternal ? 'external_link' : 'internal_link',
            /* eslint-enable @typescript-eslint/naming-convention */
          })
          .build(),
      );

      // Warning / Navigation
      if (isExternal) {
        setIsOpen(true);
      } else {
        handleSnapNavigate(href);
      }
    },
    [createEventBuilder, handleSnapNavigate, props.notification, trackEvent],
  );

  if (!footer) {
    return null;
  }

  const { href, text } = footer;
  const isMetaMaskUrl = href.startsWith('metamask:');
  const isExternal = !isMetaMaskUrl;

  return (
    <>
      <SnapLinkWarning isOpen={isOpen} onClose={handleModalClose} url={href} />
      <NotificationDetailButton
        variant={ButtonVariant.Secondary}
        isExternal={isExternal}
        text={text}
        onClick={() => onClick(href, isExternal)}
      />
    </>
  );
};
