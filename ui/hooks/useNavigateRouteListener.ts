import { useEffect } from 'react';
import { useNavigate, type Path } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { isObject } from '@metamask/utils';

import { ENVIRONMENT_TYPE_SIDEPANEL } from '#shared/constants/app';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { getEnvironmentType } from '#shared/lib/environment-type';

async function consumePendingRoute(windowId: number) {
  try {
    const response = await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE,
      body: { windowId },
    });

    if (
      isObject(response) &&
      response.type === EXTENSION_MESSAGES.CONSUME_PENDING_ROUTE &&
      isObject(response.body)
    ) {
      const { path, search } = response.body;
      if (typeof path === 'string' && path.startsWith('/')) {
        return {
          pathname: path,
          search: typeof search === 'string' ? search : '',
        } as Pick<Path, 'pathname' | 'search'>;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * In the side panel, consumes pending routes on mount and when receiving
 * `OPEN_ROUTE` nudges for this panel's window. Both mount and nudge push
 * to history, giving the user one Back click to return home.
 */
export function useNavigateRouteListener(): void {
  const navigate = useNavigate();

  useEffect(() => {
    const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

    if (!isSidePanel) {
      return undefined;
    }

    let cancelled = false;
    let currentWindowId: number | null = null;

    const onMessage = (message: unknown) => {
      if (
        isObject(message) &&
        message.type === EXTENSION_MESSAGES.OPEN_ROUTE &&
        isObject(message.body) &&
        typeof message.body.windowId === 'number' &&
        message.body.windowId === currentWindowId
      ) {
        consumePendingRoute(message.body.windowId)
          .then((route) => {
            if (!cancelled && route) {
              navigate(route);
            }
          })
          .catch(() => undefined);
      }
    };

    (async () => {
      const currentWindow = await browser.windows.getCurrent();
      if (cancelled) {
        return;
      }
      const windowId = currentWindow.id;
      if (typeof windowId !== 'number') {
        return;
      }

      currentWindowId = windowId;

      browser.runtime.onMessage.addListener(onMessage);

      const route = await consumePendingRoute(windowId);
      if (!cancelled && route) {
        navigate(route);
      }
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, [navigate]);
}
