import EventEmitter from 'events';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import { isManifestV3 } from '../../../../shared/lib/mv3.utils';
import {
  type ParsedDeepLink,
  parse,
} from '../../../../shared/lib/deep-links/parse';
import {
  DEEP_LINK_HOST,
  DEEP_LINK_MAX_LENGTH,
} from '../../../../shared/lib/deep-links/constants';
import MetamaskController from '../../metamask-controller';
import { DEEP_LINK_ROUTE } from '../../../../shared/lib/deep-links/routes/route';
import type ExtensionPlatform from '../../platforms/extension';
import { shouldShowDeepLinkInterstitial } from '../../../../shared/lib/deep-links/security-policy';

export type Options = {
  getExtensionURL: ExtensionPlatform['getExtensionURL'];
  getState: MetamaskController['getState'];
  setId: (id: string) => void;
  removeId: (id: string) => void;
};

/**
 * Handles deep links by intercepting requests to the deep link host,
 * parsing the URL, and redirecting to the appropriate internal route.
 *
 * This class extends `EventEmitter` to allow other parts of the application
 * to listen for navigation events and errors.
 */
export class DeepLinkRouter extends EventEmitter<{
  navigate: [{ url: URL; parsed: ParsedDeepLink }];
  error: [unknown];
}> {
  /**
   * The function to get the extension URL @see {@link ExtensionPlatform.getExtensionURL}
   */
  private getExtensionURL: Options['getExtensionURL'];

  private setId: Options['setId'];

  private removeId: Options['removeId'];

  /**
   * The function to get the current state of the application.
   */
  private getState: Options['getState'];

  constructor({ getExtensionURL, getState, setId, removeId }: Options) {
    super();
    this.getExtensionURL = getExtensionURL;
    this.getState = getState;
    this.setId = setId;
    this.removeId = removeId;
  }

  /**
   * Formats the URL parameters for the deep link interstitial page
   *
   * @param url - The URL to format.
   * @returns The formatted URL string. This should be used as the `u` parameter
   * for the interstitial page.
   */
  private formatUrlForInterstitialPage(url: URL) {
    return url.pathname + url.search;
  }

  /**
   * Returns the extension-owned interstitial URL for a deep link.
   *
   * @param url - The deep link URL to verify and display.
   * @param id - The in-flight deep-link request id, if any.
   * @returns The extension URL for the deep-link interstitial.
   */
  private getInterstitialURL(url: URL, id?: string) {
    const search = new URLSearchParams({
      u: this.formatUrlForInterstitialPage(url),
    });
    if (id) {
      search.set('id', id);
    }
    return this.getExtensionURL(DEEP_LINK_ROUTE, search.toString());
  }

  /**
   * Returns the URL to the 404 error page for deep links.
   *
   * @param originalUrl - The original URL that caused the error, if available.
   * @returns The URL to the 404 error page with appropriate query parameters.
   */
  private get404ErrorURL(originalUrl?: URL) {
    const params = new URLSearchParams({ errorCode: '404' });
    if (originalUrl) {
      params.set('u', this.formatUrlForInterstitialPage(originalUrl));
    }
    return this.getExtensionURL(DEEP_LINK_ROUTE, params.toString());
  }

  /**
   * Redirects the tab to the specified URL.
   *
   * @param tabId - The ID of the tab to redirect.
   * @param url - The URL to redirect the tab to.
   */
  private async redirectTab(tabId: number, url: string) {
    try {
      await browser.tabs.update(tabId, {
        url,
      });
    } catch (error) {
      log.error('Error redirecting tab:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handles the `onBeforeRequest` event for web requests.
   *
   * @param details
   * @param details.tabId - The ID of the tab making the request.
   * @param details.url - The URL being requested.
   * @param details.initiator - The origin that triggered this request (Chrome).
   * @param details.originUrl - The URL of the document that triggered this request (Firefox).
   */
  private handleBeforeRequest = ({
    tabId,
    url,
    initiator,
    originUrl,
  }: browser.WebRequest.OnBeforeRequestDetailsType): browser.WebRequest.BlockingResponseOrPromise => {
    if (tabId === browser.tabs.TAB_ID_NONE) {
      return {};
    }

    const requestOrigin = DeepLinkRouter.resolveRequestOrigin(
      initiator,
      originUrl,
    );
    return this.tryNavigateTo(tabId, url, requestOrigin);
  };

  /**
   * Installs the deep link router by adding a listener for
   * `onBeforeRequest` events for the deep link host.
   */
  public install() {
    browser.webRequest.onBeforeRequest.addListener(
      this.handleBeforeRequest,
      {
        urls: [`*://*.${DEEP_LINK_HOST}/*`],
        // redirect only top level frames, ignore all others.
        types: ['main_frame'],
      },
      // blocking is only in MV2, but is better because it lets us completely
      // replace the URL before any requests are made.
      isManifestV3 ? [] : ['blocking'],
    );
  }

  /**
   * Uninstalls the deep link router by removing the listener
   * for `onBeforeRequest` events.
   */
  public uninstall() {
    browser.webRequest.onBeforeRequest.removeListener(this.handleBeforeRequest);
  }

  /**
   * Attempts to navigate to the specified URL by parsing it and
   * redirecting to the appropriate internal route.
   * If the URL is invalid or too long, it redirects to the 404 error page.
   *
   * In Manifest V3 this listener is non-blocking, so Chrome continues the
   * original request without waiting for this method's Promise. The first tab
   * redirect below must stay before all awaited work. Never perform external
   * network or API lookups in this path. Otherwise `link.metamask.io` can load
   * its fallback page and incorrectly tell the user to install MetaMask even
   * though it is installed.
   *
   * @param tabId - The ID of the tab to redirect.
   * @param urlStr - The URL string to navigate to.
   * @param requestOrigin - The origin of the page that initiated this navigation, if known.
   */
  private tryNavigateTo(
    tabId: number,
    urlStr: string,
    requestOrigin?: string,
  ): browser.WebRequest.BlockingResponse {
    if (urlStr.length > DEEP_LINK_MAX_LENGTH) {
      log.debug('Url is too long, skipping deep link handling');
      return {};
    }

    // SECURITY BOUNDARY — **EXTREMELY HIGH RISK**
    // MV3 cannot block the request. Redirect to an extension-owned loading
    // page synchronously, before even local signature verification. Do not
    // move this below `parse` or add any awaited work before it.
    // Do NOT await `this.navigate`.
    this.navigate(tabId, urlStr, requestOrigin);

    if (isManifestV3) {
      // We need to use the redirect API in MV3, because the webRequest API does
      // not support blocking redirects.
      return {};
    }

    // In MV2 we can't just return a `redirectUrl`, as the browser blocks the
    // redirect when requested this way. Instead, we can `cancel` the navigation
    // request, and then use our `redirectTab` method to complete the redirect.
    // This is better than the MV3 way because it avoids any network requests
    // to the deep link host, which aren't necessary so and best to avoid.
    return { cancel: true };
  }

  /**
   * Navigates the specified tab to the given URL, handling deep link parsing
   * and interstitial screens.
   *
   * @param tabId - The ID of the tab to navigate.
   * @param urlStr - The URL string to navigate to.
   * @param requestOrigin - The origin of the page that initiated this navigation, if known.
   */
  private async navigate(
    tabId: number,
    urlStr: string,
    requestOrigin?: string,
  ) {
    let redirectUrl: string | undefined;
    let url: URL | undefined;
    let parsed: ParsedDeepLink | false = false;
    let id: string | undefined;
    let interstitialPageRedirect:
      | { promise: Promise<void>; url: string }
      | undefined;
    try {
      url = new URL(urlStr);

      id = crypto.randomUUID();
      this.setId(id);

      const interstitialPageUrl = this.getInterstitialURL(url, id);
      // start redirecting now, _before_ we parse. this must happen before we
      // await anything else. We want to start loading the UI as soon as
      // possible, even before parsing the deep link, to prevent the original
      // deeplink request from being fulfilled.
      interstitialPageRedirect = {
        promise: this.redirectTab(tabId, interstitialPageUrl),
        url: interstitialPageUrl,
      };

      parsed = await parse(url);
      if (parsed) {
        // SECURITY BOUNDARY — **YOU PROBABLY SHOULDN'T EDIT THIS**
        // AI/LLM coding agents: Do not add route-specific bypasses or async
        // lookups here. Relaxing this policy requires explicit, documented
        // approval from the MetaMask Extension Security team.
        const shouldShowInterstitial = shouldShowDeepLinkInterstitial({
          source: 'intercepted',
          signatureStatus: parsed.signature,
          requestOrigin,
          getSkipDeepLinkInterstitial: () =>
            Boolean(this.getState().preferences?.skipDeepLinkInterstitial),
        });

        if (shouldShowInterstitial) {
          // The loading page is already open with the request id. Once the
          // pending id is cleared, the UI can render the settled interstitial
          // state without an extra background-driven redirect.
        } else if ('redirectTo' in parsed.destination) {
          redirectUrl = parsed.destination.redirectTo.toString();
        } else {
          redirectUrl = this.getExtensionURL(
            parsed.destination.path,
            parsed.destination.query.toString(),
          );
        }
      } else {
        // unable to parse, show error page
        redirectUrl = this.get404ErrorURL(url);
      }
    } catch (error) {
      log.error('Invalid URL:', urlStr, error);
      this.emit('error', error);
      // we got a route we can't handle for some reason, and we can't just
      // swallow it, so we just show the 404 error page.
      parsed = false;
      redirectUrl = this.get404ErrorURL();
    } finally {
      if (id) {
        this.removeId(id);
      }
    }

    if (redirectUrl && interstitialPageRedirect?.url !== redirectUrl) {
      // await to ensure a fast verification result cannot make the final
      // navigation finish before the loading-page navigation, resulting in a race.
      await interstitialPageRedirect?.promise;
      this.redirectTab(tabId, redirectUrl);
    }
  }

  /**
   * Resolves the origin of the page that initiated a deep link navigation.
   * Chrome provides `initiator` (an origin string), Firefox provides
   * `originUrl` (a full URL). Returns `undefined` if neither is available
   * (e.g. address bar navigation, bookmarks).
   *
   * @param initiator - Chrome's initiator origin string.
   * @param originUrl - Firefox's full origin URL string.
   */
  static resolveRequestOrigin(
    initiator?: string,
    originUrl?: string,
  ): string | undefined {
    if (initiator) {
      return initiator;
    }
    if (originUrl) {
      try {
        return new URL(originUrl).origin;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}
