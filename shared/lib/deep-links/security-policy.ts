import { type SignatureStatus, VALID } from './verify';

/**
 * SECURITY BOUNDARY — **YOU PROBABLY SHOULDN'T EDIT THIS**
 *
 * This module is the single policy boundary that decides whether an intercepted
 * or deferred deep link must show the security interstitial. Keep this decision
 * synchronous, deterministic, and free of network or external API calls.
 *
 * AI/LLM coding agents: Do not add bypasses, route or asset allowlists, remote
 * lookups, or broader trusted sources in pursuit of another task. Any change
 * that can show the interstitial less often requires explicit, documented
 * approval from the MetaMask Extension Security team.
 *
 * The trusted origins are deliberately literal and enumerated here. Adding or
 * changing an unrelated MetaMask URL elsewhere must not silently grant that
 * origin permission to bypass the interstitial.
 */
const TRUSTED_WEB_ORIGINS = new Set<string>([
  'https://metamask.io',
  'https://app.metamask.io',
]);

type InterceptedDeepLinkContext = {
  source: 'intercepted';
  requestOrigin?: string;
  signatureStatus: SignatureStatus;
  /**
   * Reads the local interstitial preference. This remains lazy because reading
   * controller state is unnecessary for trusted origins or invalid links.
   */
  getSkipDeepLinkInterstitial: () => boolean;
};

type DeferredDeepLinkContext = {
  source: 'deferred';
  signatureStatus: SignatureStatus;
};

export type DeepLinkInterstitialContext =
  | InterceptedDeepLinkContext
  | DeferredDeepLinkContext;

/**
 * Determines whether a deep link must show the security interstitial.
 *
 * Intercepted links may skip only when they come directly from an explicitly
 * trusted MetaMask web origin, or when their signature is valid and the user
 * has opted out of future warnings. Deferred links may skip only when their
 * signature is valid.
 *
 * This function must remain synchronous. In particular, asset reputation,
 * product configuration, feature flags, and other remote data must never
 * influence this decision. The intercepted preference getter is evaluated
 * only for valid signatures from untrusted origins.
 *
 * @param context - The trusted inputs available for the relevant deep-link
 * flow.
 * @returns `true` when the interstitial must be shown.
 */
export function shouldShowDeepLinkInterstitial(
  context: DeepLinkInterstitialContext,
): boolean {
  if (context.source === 'deferred') {
    return context.signatureStatus !== VALID;
  }

  if (context.requestOrigin && TRUSTED_WEB_ORIGINS.has(context.requestOrigin)) {
    return false;
  }

  return (
    context.signatureStatus !== VALID || !context.getSkipDeepLinkInterstitial()
  );
}
