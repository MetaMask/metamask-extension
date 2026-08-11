import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { useAppSelector } from '../store/hooks';

type OpenRouteMessage = {
  type?: string;
  body?: {
    path?: unknown;
    search?: unknown;
  };
};

type PendingRoute = {
  path: string;
  search?: string;
};

function routeFromMessage(message: OpenRouteMessage): PendingRoute | null {
  const path = message.body?.path;
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return null;
  }
  const search = message.body?.search;
  return {
    path,
    ...(typeof search === 'string' ? { search } : {}),
  };
}

/**
 * Listens for `OPEN_ROUTE` runtime messages and navigates to the requested
 * path. Used for warm opens when the side panel or popup is already mounted;
 * cold opens deep-link via the surface URL hash instead.
 *
 * If a message arrives while the wallet is locked, the route is held until
 * unlock and then applied.
 */
export function useNavigateRouteListener() {
  const navigate = useNavigate();
  const isUnlocked = useAppSelector(getIsUnlocked);
  const isUnlockedRef = useRef(isUnlocked);
  const pendingRouteRef = useRef<PendingRoute | null>(null);

  isUnlockedRef.current = isUnlocked;

  useEffect(() => {
    const onMessage = (message: OpenRouteMessage) => {
      if (message?.type !== EXTENSION_MESSAGES.OPEN_ROUTE) {
        return undefined;
      }

      const route = routeFromMessage(message);
      if (!route) {
        return undefined;
      }

      if (!isUnlockedRef.current) {
        pendingRouteRef.current = route;
        return undefined;
      }

      navigate(route.search ? `${route.path}${route.search}` : route.path);
      return undefined;
    };

    browser.runtime.onMessage.addListener(onMessage);
    return () => {
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, [navigate]);

  useEffect(() => {
    if (!isUnlocked || !pendingRouteRef.current) {
      return;
    }
    const { path, search } = pendingRouteRef.current;
    pendingRouteRef.current = null;
    navigate(search ? `${path}${search}` : path);
  }, [isUnlocked, navigate]);
}
