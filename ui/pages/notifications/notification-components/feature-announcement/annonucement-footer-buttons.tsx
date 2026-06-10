import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import {
  isInternalRouteHref,
  resolveTrustedDeepLinkHref,
} from '../../../../helpers/utils/resolve-deep-link-href';
import { FeatureAnnouncementNotification } from './types';

function shouldUseDefaultLinkNavigation(
  event: React.MouseEvent<HTMLElement>,
): boolean {
  return Boolean(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey,
  );
}

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
  const navigate = useNavigate();
  const { notification } = props;
  const analyticCallback = useAnalyticEventCallback({
    id: notification.id,
    type: notification.type,
    clickType: 'internal_link',
  });

  const { extensionLink } = notification.data;

  if (!extensionLink) {
    return null;
  }

  const href = extensionLink.extensionLinkRoute.startsWith('/')
    ? extensionLink.extensionLinkRoute
    : `/${extensionLink.extensionLinkRoute}`;

  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    analyticCallback();

    if (shouldUseDefaultLinkNavigation(event)) {
      return;
    }

    event.preventDefault();
    navigate(href);
  };

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Primary}
      text={extensionLink.extensionLinkText}
      href={href}
      isExternal={false}
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

  const { externalLink } = notification.data;
  const externalLinkUrl = externalLink?.externalLinkUrl;
  const [resolvedHref, setResolvedHref] = useState<string | undefined>();

  useEffect(() => {
    if (!externalLinkUrl) {
      return undefined;
    }

    let isMounted = true;

    setResolvedHref(undefined);
    resolveTrustedDeepLinkHref(externalLinkUrl)
      .then((href) => {
        if (isMounted) {
          setResolvedHref(href);
        }
      })
      .catch((error) => {
        console.error(
          '[ExternalLinkButton] error resolving external link',
          error,
        );
        if (isMounted) {
          setResolvedHref(externalLinkUrl);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [externalLinkUrl]);

  if (!externalLinkUrl || !externalLink) {
    return null;
  }

  const { externalLinkText } = externalLink;

  const openResolvedLink = async () => {
    const href =
      resolvedHref ?? (await resolveTrustedDeepLinkHref(externalLinkUrl));

    if (isInternalRouteHref(href)) {
      navigate(href);
      return;
    }

    await global.platform.openTab({ url: href });
  };

  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    analyticCallback();

    if (shouldUseDefaultLinkNavigation(event)) {
      return;
    }

    event.preventDefault();
    openResolvedLink().catch((error) => {
      console.error('[ExternalLinkButton] error opening external link', error);
    });
  };

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Secondary}
      text={externalLinkText}
      href={externalLinkUrl}
      isExternal={resolvedHref ? !isInternalRouteHref(resolvedHref) : false}
      onClick={onClick}
    />
  );
};
