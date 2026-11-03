import { useEffect } from 'react';
import { useLocation, useNavigate, type Path } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { isObject } from '@metamask/utils';

import { EXTENSION_MESSAGES } from '#shared/constants/messages';

import { useDispatch } from '../store/hooks';
import { setShowXWidgetDeeplinkToast } from '../components/app/toast-master/utils';

const fromXWidgetSearchParam = 'fromXWidget';

function routeFromMessage(
  message: unknown,
): (Pick<Path, 'pathname' | 'search'> & { fromXWidget?: boolean }) | null {
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
  const fromXWidget = message.body?.fromXWidget === true;
  return {
    pathname,
    search: typeof search === 'string' ? search : '',
    fromXWidget,
  };
}

function pathWithoutXWidgetFlag(route: Pick<Path, 'pathname' | 'search'>) {
  const params = new URLSearchParams(route.search);
  if (!params.has(fromXWidgetSearchParam)) {
    return route;
  }
  params.delete(fromXWidgetSearchParam);
  const search = params.toString();
  return {
    pathname: route.pathname,
    search: search ? `?${search}` : '',
  };
}

/**
 * Navigates on `OPEN_ROUTE` runtime messages. Defers until unlock if locked.
 */
export function useNavigateRouteListener(): void {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get(fromXWidgetSearchParam) !== '1') {
      return;
    }
    dispatch(setShowXWidgetDeeplinkToast(true));
    navigate(pathWithoutXWidgetFlag(location), { replace: true });
  }, [location, navigate, dispatch]);

  useEffect(() => {
    const onMessage = (message: unknown) => {
      const route = routeFromMessage(message);
      if (!route) {
        return undefined;
      }

      const { fromXWidget, ...path } = route;
      if (fromXWidget) {
        dispatch(setShowXWidgetDeeplinkToast(true));
      }

      navigate(path);
      return undefined;
    };

    browser.runtime.onMessage.addListener(onMessage);
    return () => {
      browser.runtime.onMessage.removeListener(onMessage);
    };
  }, [navigate, dispatch]);
}
