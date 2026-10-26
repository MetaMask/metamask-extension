import browser from 'webextension-polyfill';
import type { PhishingDetectorResult } from '@metamask/phishing-controller';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import { getPlatform } from '../util';
import { phishingPageHref, phishingPageUrl } from './phishing-warning-page';
import type { PhishingDetectionController } from './types';

type PhishingDetectionDependencies = {
  browserApi: typeof browser;
  isManifestV3Flag: boolean;
  isFirefox: boolean;
  captureException: (error: unknown) => void;
  inTest: boolean;
  trackPhishingPageDisplayed: (properties: {
    url: string;
    reason: string;
    requestDomain: string | undefined;
  }) => void;
};

function getDefaultDependencies(): PhishingDetectionDependencies {
  const { sentry } = global as {
    sentry?: { captureException: (error: unknown) => void };
  };

  return {
    browserApi: browser,
    isManifestV3Flag: isManifestV3,
    isFirefox: getPlatform() === PLATFORM_FIREFOX,
    captureException: (error) => sentry?.captureException(error),
    inTest: Boolean(process.env.IN_TEST),
    trackPhishingPageDisplayed: ({ url, reason, requestDomain }) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.PhishingPageDisplayed)
          .addCategory(MetaMetricsEventCategory.Phishing)
          .addProperties({
            url,
            referrer: {
              url,
            },
            reason,
            requestDomain,
          })
          .build({
            excludeMetaMetricsId: true,
          }),
      );
    },
  };
}

/**
 * Detects known phishing pages as soon as the browser begins to load the page.
 * If the page is a known phishing page, the user is redirected to the phishing
 * warning page.
 *
 * This detection works even if the phishing page is now a redirect to a new
 * domain that our phishing detection system is not aware of.
 *
 * @param controller - MetaMask controller slice with onboarding, preferences, and phishing controllers.
 * @param dependencies - Optional dependency overrides (used in unit tests).
 */
export function maybeDetectPhishing(
  controller: PhishingDetectionController,
  dependencies: Partial<PhishingDetectionDependencies> = {},
): void {
  const deps = { ...getDefaultDependencies(), ...dependencies };
  const { browserApi } = deps;

  /**
   * Redirects a tab to the phishing warning page.
   *
   * @param tabId - The ID of the tab to redirect.
   * @param url - The URL to redirect to (phishing warning page).
   * @returns Whether the redirect was successful.
   */
  async function redirectTab(tabId: number, url: string): Promise<boolean> {
    try {
      const tab = await browserApi.tabs.get(tabId);

      // Prevent redirect when due to Google pre-fetching
      if (tab.url?.startsWith('https://www.google.com/search')) {
        return false;
      }

      await browserApi.tabs.update(tabId, {
        url,
      });
      return true;
    } catch (error) {
      deps.captureException(error);
      return false;
    }
  }

  // we can use the blocking API in MV2, but not in MV3
  const isManifestV2 = !deps.isManifestV3Flag;
  browserApi.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId === browserApi.tabs.TAB_ID_NONE) {
        return {};
      }

      const { completedOnboarding } = controller.onboardingController.state;
      if (!completedOnboarding) {
        return {};
      }

      const prefState = controller.preferencesController.state;
      if (!prefState.usePhishDetect) {
        return {};
      }

      // ignore requests that come from our phishing warning page, as
      // the requests may come from the "continue to site" link, so we'll
      // actually _want_ to bypass the phishing detection. We shouldn't have to
      // do this, because the phishing site does tell the extension that the
      // domain it blocked it now "safe", but it does this _after_ the request
      // begins (which would get blocked by this listener). So we have to bail
      // on detection here.
      // This check can be removed once  https://github.com/MetaMask/phishing-warning/issues/160
      // is shipped.
      if (
        details.initiator &&
        details.initiator !== 'null' &&
        // compare normalized URLs
        new URL(details.initiator).host === phishingPageUrl.host
      ) {
        return {};
      }

      const { hostname, href, searchParams } = new URL(details.url);
      if (
        deps.inTest &&
        searchParams.has('IN_TEST_BYPASS_EARLY_PHISHING_DETECTION')
      ) {
        // this is a test page that needs to bypass early phishing detection
        return {};
      }

      controller.phishingController.maybeUpdateState();

      const blockedRequestResponse: PhishingDetectorResult =
        controller.phishingController.isBlockedRequest(details.url);

      let phishingTestResponse: PhishingDetectorResult | undefined;
      if (details.type === 'main_frame' || details.type === 'sub_frame') {
        phishingTestResponse = controller.phishingController.test(details.url);
      }

      // if the request is not blocked, and the phishing test is not blocked, return and don't show the phishing screen
      if (!phishingTestResponse?.result && !blockedRequestResponse.result) {
        return {};
      }

      // Determine the block reason based on the type
      let blockReason: string;
      let blockedUrl = href;
      if (phishingTestResponse?.result && blockedRequestResponse.result) {
        blockReason = `${phishingTestResponse.type} and ${blockedRequestResponse.type}`;
      } else if (phishingTestResponse?.result) {
        blockReason = phishingTestResponse.type;
      } else {
        // Override the blocked URL to the initiator URL if the request was flagged by c2 detection
        blockReason = blockedRequestResponse.type;
        blockedUrl = details.initiator ?? href;
      }

      let blockedHostname: string;
      try {
        blockedHostname = new URL(blockedUrl).hostname;
      } catch {
        // If blockedUrl is null or undefined, fall back to the original URL
        blockedHostname = hostname;
        blockedUrl = href;
      }

      const querystring = new URLSearchParams({
        hostname: blockedHostname, // used for creating the EPD issue title (false positive report)
        href: blockedUrl, // used for displaying the URL on the phsihing warning page + proceed anyway URL
      });
      const redirectUrl = new URL(phishingPageHref);
      redirectUrl.hash = querystring.toString();
      const redirectHref = redirectUrl.toString();

      const trackPhishingMetrics = () => {
        if (!deps.isFirefox) {
          deps.trackPhishingPageDisplayed({
            url: blockedUrl,
            reason: blockReason,
            requestDomain: blockedRequestResponse.result ? hostname : undefined,
          });
        }
      };

      // blocking is better than tab redirection, as blocking will prevent
      // the browser from loading the page at all
      if (isManifestV2) {
        // We can redirect `main_frame` requests directly to the warning page.
        // For non-`main_frame` requests (e.g. `sub_frame` or WebSocket), we cancel them
        // and redirect the whole tab asynchronously so that the user sees the warning.
        if (details.type === 'main_frame') {
          trackPhishingMetrics();
          return { redirectUrl: redirectHref };
        }
        redirectTab(details.tabId, redirectHref).then((redirected) => {
          if (redirected) {
            trackPhishingMetrics();
          }
        });
        return { cancel: true };
      }
      redirectTab(details.tabId, redirectHref).then((redirected) => {
        if (redirected) {
          trackPhishingMetrics();
        }
      });
      return {};
    },
    {
      urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'],
    },
    isManifestV2 ? ['blocking'] : [],
  );
}
