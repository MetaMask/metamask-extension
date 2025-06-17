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

// `routes.ts` seem to require routes have a leading slash, but then the
// UI always redirects it to the non-slashed version. So we just use the
// non-slashed version here to skip that redirect step.
const slashRe = /^\//u;
const TRIMMED_DEEP_LINK_ROUTE = DEEP_LINK_ROUTE.replace(slashRe, '');

export type Options = {
  getExtensionURL(route?: string | null, queryString?: string | null): string;
  getState: MetamaskController['getState'];
};

export class DeepLinkRouter extends EventEmitter<{
  navigate: [{ url: URL; parsed: ParsedDeepLink }];
}> {
  private getExtensionURL: Options['getExtensionURL'];

  private getState: Options['getState'];

  constructor({ getExtensionURL, getState }: Options) {
    super();
    this.getExtensionURL = getExtensionURL;
    this.getState = getState;
  }

  private get404ErrorURL() {
    return this.getExtensionURL(
      TRIMMED_DEEP_LINK_ROUTE.replace(slashRe, ''),
      new URLSearchParams({
        errorCode: '404',
      }).toString(),
    );
  }

  private async redirectTab(tabId: number, url: string) {
    try {
      return await browser.tabs.update(tabId, {
        url,
      });
    } catch (error) {
      log.error('Error redirecting tab:', error);
      return globalThis.sentry?.captureException(error);
    }
  }

  private handleBeforeRequest = ({
    tabId,
    url,
  }: browser.WebRequest.OnBeforeRequestDetailsType): browser.WebRequest.BlockingResponseOrPromise => {
    if (tabId === browser.tabs.TAB_ID_NONE) {
      return {};
    }

    return this.tryNavigateTo(tabId, url);
  };

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

  public uninstall() {
    browser.webRequest.onBeforeRequest.removeListener(this.handleBeforeRequest);
  }

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

        const skipDeepLinkInterstitial = Boolean(
          this.getState().preferences?.skipDeepLinkInterstitial,
        );
        if ('redirectTo' in parsed.destination) {
          link = parsed.destination.redirectTo.toString();
        } else if (parsed.signed && skipDeepLinkInterstitial) {
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
      // we got a route we can't handle, so just force the "404" page
      link = this.get404ErrorURL();
    }

    if (isManifestV3) {
      // We need to use the redirect API in MV3, because the webRequest API does
      // not support blocking redirects.
      this.redirectTab(tabId, link);
      return {};
    }

    // In MV2 we can't just return a `redirectUrl`, as the browser blocks the
    // redirect when requested this way. Instead, we can `cancel` the navigation
    // request, and then use our `redirectTab` method to complete the redirect.
    // This is better than the MV3 way because it avoids any network requests
    // to the deep link host, which aren't necessary so and best to avoid.
    this.redirectTab(tabId, link);
    return { cancel: true };
  }
}
