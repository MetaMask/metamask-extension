import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import {
  isInternalRouteHref,
  resolveTrustedDeepLinkHref,
} from '../../../../helpers/utils/resolve-deep-link-href';
import { FeatureAnnouncementNotification } from './types';

type ResolvedHref = {
  href: string;
  sourceUrl: string;
};

type PendingResolvedHref = {
  promise: Promise<string>;
  sourceUrl: string;
};

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

function getClientRouteFromExtensionLinkRoute(
  extensionLinkRoute: string,
): string | undefined {
  if (extensionLinkRoute === 'home.html') {
    return '/';
  }

  const [, hashRoute] =
    /^home\.html#(\/.*)$/u.exec(extensionLinkRoute) ?? [];

  return hashRoute && isInternalRouteHref(hashRoute) ? hashRoute : undefined;
}

const useAnalyticEventCallback = (props: {
  id: string;
  type: string;
  clickType: 'external_link' | 'internal_link';
}) => {
  const { trackEvent, createEventBuilder } = useAnalytics();

  const analyticsEvent = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NotificationDetailClicked)
        .addCategory(MetaMetricsEventCategory.NotificationInteraction)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          notification_id: props.id,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          notification_type: props.type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          clicked_item: props.clickType,
        })
        .build(),
    );
  }, [createEventBuilder, props.clickType, props.id, props.type, trackEvent]);

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

  const href = `/${extensionLink.extensionLinkRoute}`;
  const clientRoute = getClientRouteFromExtensionLinkRoute(
    extensionLink.extensionLinkRoute,
  );

  const onClick: React.MouseEventHandler<HTMLElement> = (event) => {
    analyticCallback();

    if (!clientRoute || shouldUseDefaultLinkNavigation(event)) {
      return;
    }

    event.preventDefault();
    navigate(clientRoute);
  };

  return (
    <NotificationDetailButton
      variant={ButtonVariant.Primary}
      text={extensionLink.extensionLinkText}
      href={href}
      isExternal={!clientRoute}
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
  const [resolvedHref, setResolvedHref] = useState<ResolvedHref | undefined>();
  const resolvedHrefRef = useRef<ResolvedHref | undefined>();
  const pendingResolvedHrefRef = useRef<PendingResolvedHref | undefined>();

  useEffect(() => {
    resolvedHrefRef.current = resolvedHref;
  }, [resolvedHref]);

  const resolveHref = useCallback((): Promise<string> => {
    const linkUrl = externalLinkUrl;

    if (!linkUrl) {
      return Promise.resolve('');
    }

    const resolvedHrefForLink = resolvedHrefRef.current;
    if (resolvedHrefForLink?.sourceUrl === linkUrl) {
      return Promise.resolve(resolvedHrefForLink.href);
    }

    const pendingResolvedHref = pendingResolvedHrefRef.current;
    if (pendingResolvedHref?.sourceUrl === linkUrl) {
      return pendingResolvedHref.promise;
    }

    const promise = resolveTrustedDeepLinkHref(linkUrl).catch((error) => {
      console.error(
        '[ExternalLinkButton] error resolving external link',
        error,
      );
      return linkUrl;
    });

    pendingResolvedHrefRef.current = {
      promise,
      sourceUrl: linkUrl,
    };

    return promise;
  }, [externalLinkUrl]);

  useEffect(() => {
    if (!externalLinkUrl) {
      resolvedHrefRef.current = undefined;
      pendingResolvedHrefRef.current = undefined;
      setResolvedHref(undefined);
      return;
    }

    let isMounted = true;
    const sourceUrl = externalLinkUrl;

    if (resolvedHrefRef.current?.sourceUrl !== sourceUrl) {
      resolvedHrefRef.current = undefined;
    }

    setResolvedHref((currentResolvedHref) =>
      currentResolvedHref?.sourceUrl === sourceUrl
        ? currentResolvedHref
        : undefined,
    );

    const pendingResolvedHref = resolveHref();
    pendingResolvedHref
      .then((href) => {
        if (isMounted) {
          const nextResolvedHref = { href, sourceUrl };
          resolvedHrefRef.current = nextResolvedHref;
          setResolvedHref(nextResolvedHref);
        }
      })
      .finally(() => {
        if (
          pendingResolvedHrefRef.current?.sourceUrl === sourceUrl &&
          pendingResolvedHrefRef.current.promise === pendingResolvedHref
        ) {
          pendingResolvedHrefRef.current = undefined;
        }
      });

    return () => {
      isMounted = false;
      if (
        pendingResolvedHrefRef.current?.sourceUrl === sourceUrl &&
        pendingResolvedHrefRef.current.promise === pendingResolvedHref
      ) {
        pendingResolvedHrefRef.current = undefined;
      }
    };
  }, [externalLinkUrl, resolveHref]);

  if (!externalLinkUrl || !externalLink) {
    return null;
  }

  const { externalLinkText } = externalLink;
  const resolvedHrefForExternalLink =
    resolvedHref?.sourceUrl === externalLinkUrl ? resolvedHref.href : undefined;

  const openResolvedLink = async () => {
    const href = await resolveHref();

    if (!href) {
      return;
    }

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
      href={resolvedHrefForExternalLink ?? externalLinkUrl}
      isExternal={
        resolvedHrefForExternalLink
          ? !isInternalRouteHref(resolvedHrefForExternalLink)
          : false
      }
      onClick={onClick}
    />
  );
};
