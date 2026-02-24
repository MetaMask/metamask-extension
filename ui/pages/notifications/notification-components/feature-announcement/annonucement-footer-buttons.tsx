import React, { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import {
  getShieldInAppNavigationFromExternalLink,
  SHIELD_ANNOUNCEMENT_NOTIFICATION_ID,
} from '../../../../../shared/modules/shield';
import { FeatureAnnouncementNotification } from './types';

const useAnalyticEventCallback = (props: {
  id: string;
  type: string;
  clickType: 'external_link' | 'internal_link';
}) => {
  const { trackEvent } = useContext(MetaMetricsContext);

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
  const navigate = useNavigate();
  const { notification } = props;
  const analyticCallback = useAnalyticEventCallback({
    id: notification.id,
    type: notification.type,
    clickType: 'external_link',
  });

  if (!notification.data.externalLink) {
    return null;
  }

  let href: string | undefined = notification.data.externalLink.externalLinkUrl;
  let isExternal = true;
  const isShieldAnnouncementNotification =
    notification.id === SHIELD_ANNOUNCEMENT_NOTIFICATION_ID;
  // use native navigation for shield announcement instead of opening new tab
  // TODO: clean this when we have better control of how deeplink are opened
  if (isShieldAnnouncementNotification) {
    // don't open new tab with href
    href = undefined;
    // don't show external arrow icon
    isExternal = false;
  }
  const onClick = () => {
    analyticCallback();
    if (isShieldAnnouncementNotification && notification.data.externalLink) {
      try {
        const path = getShieldInAppNavigationFromExternalLink(
          notification.data.externalLink.externalLinkUrl,
        );
        navigate(path);
      } catch (error) {
        console.error(
          '[ExternalLinkButton] error parsing external link',
          error,
        );
      }
    }
  };

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Secondary}
      text={notification.data.externalLink.externalLinkText}
      href={href}
      isExternal={isExternal}
      onClick={onClick}
    />
  );
};
