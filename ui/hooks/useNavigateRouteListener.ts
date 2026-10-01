import { useEffect } from 'react';
import { useNavigate, type Path } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { isObject } from '@metamask/utils';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';

function routeFromMessage(
  message: unknown,
): Pick<Path, 'pathname' | 'search'> | null {
  if (
    !isObject(message) ||
    message.type !== EXTENSION_MESSAGES.OPEN_ROUTE ||
    !isObject(message.body)
  ) {
    return null;
  }

  const pathname = message.body.path;
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

  useEffect(() => {
    const onMessage = (message: unknown) => {
      const route = routeFromMessage(message);
      if (!route) {
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
}
