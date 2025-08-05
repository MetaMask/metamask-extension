import EventEmitter from 'events';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
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
import {
  SignatureStatus,
  VALID,
} from '../../../../shared/lib/deep-links/verify';

// `routes.ts` seem to require routes have a leading slash, but then the
// UI always redirects it to the non-slashed version. So we just use the
// non-slashed version here to skip that redirect step.
const slashRe = /^\//u;
const TRIMMED_DEEP_LINK_ROUTE = DEEP_LINK_ROUTE.replace(slashRe, '');

export type Options = {
  getExtensionURL: ExtensionPlatform['getExtensionURL'];
  getState: MetamaskController['getState'];
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

  /**
   * The function to get the current state of the application.
   */
  private getState: Options['getState'];

  constructor({ getExtensionURL, getState }: Options) {
    super();
    this.getExtensionURL = getExtensionURL;
    this.getState = getState;
  }

  /**
   * Returns the URL to the 404 error page for deep links.
   */
  private get404ErrorURL() {
    return this.getExtensionURL(
      TRIMMED_DEEP_LINK_ROUTE,
      new URLSearchParams({
        errorCode: '404',
      }).toString(),
    );
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
   */
  private handleBeforeRequest = ({
    tabId,
    url,
  }: browser.WebRequest.OnBeforeRequestDetailsType): browser.WebRequest.BlockingResponseOrPromise => {
    if (tabId === browser.tabs.TAB_ID_NONE) {
      return {};
    }

    return this.tryNavigateTo(tabId, url);
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
   * @param tabId - The ID of the tab to redirect.
   * @param urlStr - The URL string to navigate to.
   */
  private async tryNavigateTo(
    tabId: number,
    urlStr: string,
  ): Promise<browser.WebRequest.BlockingResponse> {
    if (urlStr.length > DEEP_LINK_MAX_LENGTH) {
      log.debug('Url is too long, skipping deep link handling');
      return {};
    }

    let link: string;
    try {
      const url = new URL(urlStr);

      const parsed = await parse(url);
      if (parsed) {
        this.emit('navigate', { url, parsed });

        if ('redirectTo' in parsed.destination) {
          link = parsed.destination.redirectTo.toString();
        } else if (this.canSkipInterstitial(parsed.signature)) {
          // signed links than can and should skip the interstitial page
          link = this.getExtensionURL(
            parsed.destination.path,
            parsed.destination.query.toString(),
          );
        } else {
          // unsigned links or signed links that don't skip the interstitial
          const search = new URLSearchParams({
            u: url.pathname + url.search,
          });
          link = this.getExtensionURL(
            TRIMMED_DEEP_LINK_ROUTE,
            search.toString(),
          );
        }
      } else {
        // unable to parse, show error page
        link = this.get404ErrorURL();
      }
    } catch (error) {
      log.error('Invalid URL:', urlStr, error);
      this.emit('error', error);
      // we got a route we can't handle for some reason, and we can't just
      // swallow it, so we just show the 404 error page.
      link = this.get404ErrorURL();
    }

    this.redirectTab(tabId, link);

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
   * Checks if the interstitial page can be skipped based on the signature status.
   * If the signature is valid and the user has opted to skip the interstitial,
   * it returns true.
   *
   * @param signatureStatus - The signature status of the deep link.
   */
  canSkipInterstitial(
    signatureStatus: SignatureStatus,
  ): signatureStatus is typeof VALID {
    if (signatureStatus !== VALID) {
      return false;
    }
    return Boolean(this.getState().preferences?.skipDeepLinkInterstitial);
  }
}
