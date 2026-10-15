import { getDefaultRedirectCallbackUrl } from '@metamask/ramps-controller';
import { getRampsEnvironment } from './environment';

/**
 * Builds the redirect URL handed to providers when a quote is requested, and
 * matched against tab navigations to detect the end of a hosted checkout.
 *
 * Delegates to `@metamask/ramps-controller`'s `getDefaultRedirectCallbackUrl`
 * so the callback host map has a single source of truth in core instead of
 * being duplicated here. Lives in `shared` so both the UI (quote redirectUrl)
 * and the background checkout watcher resolve the same host.
 *
 * @returns The callback base URL for the current build's ramps environment.
 */
export function getRampCallbackBaseUrl(): string {
  return getDefaultRedirectCallbackUrl(getRampsEnvironment());
}
