import React, { useCallback, useContext } from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import { FeatureAnnouncementNotification } from './types';

const useAnalyticEventCallback = (props: {
  id: string;
  type: string;
  clickType: 'external_link' | 'internal_link';
}) => {
  const trackEvent = useContext(MetaMetricsContext);

  const analyticsEvent = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationDetailClicked,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        notification_id: props.id,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        notification_type: props.type,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        clicked_item: props.clickType,
      },
    });
  }, [props.clickType, props.id, props.type, trackEvent]);

  return analyticsEvent;
};

export const ExtensionLinkButton = (props: {
  notification: FeatureAnnouncementNotification;
}) => {
  const { notification } = props;
  const onClick = useAnalyticEventCallback({
    id: notification.id,
    type: notification.type,
    clickType: 'internal_link',
  });

  if (!notification.data.extensionLink) {
    return null;
  }

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Primary}
      text={notification.data.extensionLink.extensionLinkText}
      href={`/${notification.data.extensionLink.extensionLinkRoute}`}
      // Even if the link is not external, it will open in a new tab
      // to avoid breaking the popup
      isExternal={true}
      onClick={onClick}
    />
  );
};

export const ExternalLinkButton = (props: {
  notification: FeatureAnnouncementNotification;
}) => {
  const { notification } = props;
  const onClick = useAnalyticEventCallback({
    id: notification.id,
    type: notification.type,
    clickType: 'external_link',
  });

  if (!notification.data.externalLink) {
    return null;
  }

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Secondary}
      text={notification.data.externalLink.externalLinkText}
      href={`${notification.data.externalLink.externalLinkUrl}`}
      isExternal={true}
      onClick={onClick}
    />
  );
};
