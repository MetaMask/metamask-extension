import { useEffect, useRef } from 'react';
import { useNavigate, type Path } from 'react-router-dom';
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

function routeFromMessage(
  message: OpenRouteMessage,
): Pick<Path, 'pathname' | 'search'> | null {
  const pathname = message.body?.path;
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) {
    return null;
  }
  const search = message.body?.search;
  return {
    pathname,
    search: typeof search === 'string' ? search : '',
  };
}

/**
 * Navigates on `OPEN_ROUTE` runtime messages. Defers until unlock if locked.
 */
export function useNavigateRouteListener(): void {
  const navigate = useNavigate();
  const isUnlocked = useAppSelector(getIsUnlocked);
  const isUnlockedRef = useRef(isUnlocked);
  const pendingRouteRef = useRef<Pick<Path, 'pathname' | 'search'> | null>(
    null,
  );

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

      navigate(route);
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
    const route = pendingRouteRef.current;
    pendingRouteRef.current = null;
    navigate(route);
  }, [isUnlocked, navigate]);
}
