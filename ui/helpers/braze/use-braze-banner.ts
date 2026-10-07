import { useCallback, useEffect, useRef, useState } from 'react';
import * as braze from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import {
  identifyBrazeUser,
  getIdentifiedBrazeProfileId,
} from './identify-braze-user';
import { getBrazeBannerContent } from './banner-properties';
import { BRAZE_BANNER_STARTUP_TIMEOUT_MS } from './banner-constants';
import { dismissBrazeBanner } from './banner-analytics';

type BannerState = {
  status: 'loading' | 'visible' | 'empty' | 'dismissed';
  banner: braze.Banner | null;
};

/**
 * Adapts the Web SDK 7 event stream to Mobile's native banner state machine.
 * Subscribe after identification; CACHE_REPLAY is the synchronous warm-cache probe.
 * The owner must remount this hook when its identity or placement changes.
 *
 * @param placementId - Dashboard placement to refresh and render.
 * @param profileId - Canonical profile identity for this mount.
 */
export function useBrazeBanner(placementId: string, profileId: string) {
  const dismissedRef = useRef(false);
  const [state, setState] = useState<BannerState>({
    status: 'loading',
    banner: null,
  });

  useEffect(() => {
    let active = true;
    let startupWindowOpen = true;
    let currentBannerId: string | null = null;
    dismissedRef.current = false;

    if (!identifyBrazeUser(profileId)) {
      // Synchronize a failed external SDK operation; identity changes remount the component.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: 'empty', banner: null });
      return undefined;
    }

    const timeout = setTimeout(() => {
      startupWindowOpen = false;
      setState((previous) =>
        previous.status === 'loading'
          ? { status: 'empty', banner: null }
          : previous,
      );
    }, BRAZE_BANNER_STARTUP_TIMEOUT_MS);

    const handleEvent = (event: braze.BannersEvent) => {
      if (
        !active ||
        dismissedRef.current ||
        getIdentifiedBrazeProfileId() !== profileId
      ) {
        return;
      }

      // Click/impression/dismiss analytics are also delivered on this stream.
      if (
        event.type === braze.ChannelEventType.ERROR &&
        event.retryState === braze.RetryState.DO_NOT_RETRY &&
        event.reason !== braze.ChannelErrorReason.FEATURE_DISABLED
      ) {
        // FEATURE_DISABLED may be the initial replay before server config loads.
        // The SDK can enable the channel later; keep listening during startup.
        startupWindowOpen = false;
        setState((previous) =>
          previous.status === 'loading'
            ? { status: 'empty', banner: null }
            : previous,
        );
        return;
      }
      if (event.type === braze.ChannelEventType.CACHE_LOAD) {
        currentBannerId = null;
        setState({ status: 'empty', banner: null });
        return;
      }
      if (
        event.type !== braze.ChannelEventType.CACHE_REPLAY &&
        event.type !== braze.ChannelEventType.DATA_UPDATED
      ) {
        return;
      }

      const candidate = event.cacheSnapshot.banners[placementId];
      if (!candidate) {
        // A completed refresh can remove an expired or dismissed placement.
        if (event.type === braze.ChannelEventType.DATA_UPDATED) {
          currentBannerId = null;
          setState({ status: 'empty', banner: null });
        }
        return;
      }

      const content = getBrazeBannerContent(candidate);
      if (
        candidate.isControl ||
        candidate.placementId !== placementId ||
        !content.body?.trim()
      ) {
        currentBannerId = null;
        setState({ status: 'empty', banner: null });
        return;
      }
      if (
        candidate.id === currentBannerId ||
        (!startupWindowOpen && currentBannerId === null)
      ) {
        return;
      }
      currentBannerId = candidate.id;
      setState({ status: 'visible', banner: candidate });
    };

    let subscription: string | undefined;
    try {
      subscription = braze.subscribeToBannersEvents(handleEvent);
      braze.requestBannersRefresh([placementId]);
    } catch (error) {
      captureException(error);
      setState({ status: 'empty', banner: null });
    }

    return () => {
      active = false;
      clearTimeout(timeout);
      if (subscription) {
        braze.removeSubscription(subscription);
      }
    };
  }, [placementId, profileId]);

  const dismiss = useCallback(() => {
    if (!state.banner || dismissedRef.current) {
      return;
    }
    dismissedRef.current = true;
    setState({ status: 'dismissed', banner: null });
    dismissBrazeBanner(state.banner);
  }, [state.banner]);

  return { ...state, dismiss };
}
