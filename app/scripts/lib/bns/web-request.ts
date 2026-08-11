/**
 * [BNES] H1.5 — webRequest redirect for failed `.bnes` main_frame navigations.
 *
 * Pattern mirrors ENS-IPFS (onErrorOccurred for non-DNS TLDs) but stays on an
 * independent BNS path. Destination is always a trusted path-gateway HTTPS URL
 * opened via tabs.update — never remote HTML inside chrome-extension://.
 */

import browser from 'webextension-polyfill';

import {
  decideBnsTabRedirect,
  extractBnesHostFromNavigationUrl,
  extractPathFromNavigationUrl,
} from '../../../../shared/bns/redirect-policy';
import { resolveBnesForUi } from './resolve-for-ui';
import type { BnsResolverApi } from './create-bns-resolver';
import { getBnsResolver } from './setup';

/** Match http(s) hosts under the `.bnes` suffix (main frame only). */
const BNS_URL_PATTERNS = ['*://*.bnes/*'] as const;

export type SetupBnsWebRequestOptions = {
  /**
   * Injectable resolver; defaults to getBnsResolver().
   * Pass null to force "not installed" behaviour in tests.
   */
  resolver?: BnsResolverApi | null;
  /**
   * Injectable tabs.update (tests). Defaults to browser.tabs.update.
   */
  updateTab?: (
    tabId: number,
    updateProperties: { url: string },
  ) => Promise<unknown>;
  /**
   * When false, skip registering the listener (unit tests of attempt only).
   * Default true.
   */
  installListener?: boolean;
};

export type BnsWebRequestApi = {
  remove: () => void;
  /** Exposed for unit tests: process one failed navigation. */
  handleErrorOccurred: (details: {
    tabId: number;
    url: string;
  }) => Promise<void>;
};

/**
 * Install the BNS main_frame error listener that may redirect to a trusted
 * IPFS gateway after on-chain contenthash resolution.
 *
 * @param options - Optional injectors for tests.
 * @returns API with remove() and handleErrorOccurred for tests.
 */
export function setupBnsWebRequestRedirect(
  options: SetupBnsWebRequestOptions = {},
): BnsWebRequestApi {
  const updateTab =
    options.updateTab ??
    ((tabId: number, updateProperties: { url: string }) =>
      browser.tabs.update(tabId, updateProperties));

  async function handleErrorOccurred(details: {
    tabId: number;
    url: string;
  }): Promise<void> {
    const { tabId, url } = details;
    if (tabId === -1 || tabId === browser.tabs.TAB_ID_NONE) {
      return;
    }

    const host = extractBnesHostFromNavigationUrl(url);
    if (!host) {
      return;
    }

    const path = extractPathFromNavigationUrl(url);
    const resolver =
      options.resolver === undefined ? getBnsResolver() : options.resolver;

    const display = await resolveBnesForUi({
      name: host,
      path,
      resolver,
    });

    let trustedHost = '';
    try {
      if (resolver && resolver.isConfigured()) {
        trustedHost = resolver.getConfig().gatewayHost;
      }
    } catch {
      return;
    }

    if (!trustedHost) {
      return;
    }

    const decision = decideBnsTabRedirect(display, trustedHost);
    if (decision.action !== 'redirect') {
      return;
    }
    if (decision.renderInExtension !== false) {
      return;
    }

    await updateTab(tabId, { url: decision.url });
  }

  const listener = (details: { tabId: number; url: string }) => {
    // Fire-and-forget; webRequest onErrorOccurred is not blocking.
    void handleErrorOccurred(details);
  };

  if (options.installListener !== false) {
    browser.webRequest.onErrorOccurred.addListener(listener, {
      urls: [...BNS_URL_PATTERNS],
      types: ['main_frame'],
    });
  }

  return {
    remove() {
      if (options.installListener !== false) {
        browser.webRequest.onErrorOccurred.removeListener(listener);
      }
    },
    handleErrorOccurred,
  };
}
