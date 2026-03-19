import { redirect } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';
import type { Store } from 'redux';
import {
  BASIC_FUNCTIONALITY_OFF_ROUTE,
  ONBOARDING_ROUTE,
  UNLOCK_ROUTE,
} from '../../helpers/constants/routes';

export function requireInitialized(store: Store) {
  const state = store.getState();
  const { completedOnboarding } = state.metamask;

  if (!completedOnboarding) {
    return redirect(ONBOARDING_ROUTE);
  }

  return null;
}

function requireAuthenticated(store: Store, request?: Request) {
  const state = store.getState();
  const { completedOnboarding, isUnlocked } = state.metamask;

  if (!completedOnboarding) {
    return redirect(ONBOARDING_ROUTE);
  }

  if (!isUnlocked) {
    if (!request) {
      return redirect(UNLOCK_ROUTE);
    }

    const requestUrl = new URL(request.url);
    const from = `${requestUrl.pathname}${requestUrl.search}`;
    const searchParams = new URLSearchParams({ from });

    return redirect(`${UNLOCK_ROUTE}?${searchParams.toString()}`);
  }

  return null;
}

function requireExternalServices(store: Store, request?: Request) {
  const state = store.getState();
  const { useExternalServices } = state.metamask;

  if (!useExternalServices) {
    if (!request) {
      return redirect(BASIC_FUNCTIONALITY_OFF_ROUTE);
    }

    const requestUrl = new URL(request.url);
    const from = `${requestUrl.pathname}${requestUrl.search}`;
    const searchParams = new URLSearchParams({ from });

    return redirect(
      `${BASIC_FUNCTIONALITY_OFF_ROUTE}?${searchParams.toString()}`,
    );
  }

  return null;
}

export const createProtectedLoader =
  (store: Store) =>
  ({ request }: LoaderFunctionArgs) =>
    requireAuthenticated(store, request);

export const createBasicFunctionalityLoader =
  (store: Store) =>
  ({ request }: LoaderFunctionArgs) =>
    requireExternalServices(store, request);
