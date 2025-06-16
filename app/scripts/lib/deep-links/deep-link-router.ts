import browser from 'webextension-polyfill';
import log from 'loglevel';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { DEEP_LINK_ROUTE } from '../../../../ui/helpers/constants/routes';
import { parse } from '../../../../shared/lib/deep-links/parse';
import {
  DEEP_LINK_HOST,
  DEEP_LINK_MAX_LENGTH,
} from '../../../../shared/lib/deep-links/constants';
import MetamaskController from '../../metamask-controller';

// `routes.ts` seem to require routes have a leading slash, but then the
// UI always redirects it to the non-slashed version. So we just use the
// non-slashed version here to skip that redirect step.
const slashRe = /^\//u;
const TRIMMED_DEEP_LINK_ROUTE = DEEP_LINK_ROUTE.replace(slashRe, '');

const { sentry } = global;

export type Options = {
  getExtensionURL(route?: string | null, queryString?: string | null): string;
  getState: MetamaskController['getState'];
};

export class DeepLinkRouter {
  private getExtensionURL: Options['getExtensionURL'];

  private getState: Options['getState'];

  constructor({ getExtensionURL, getState }: Options) {
    this.getExtensionURL = getExtensionURL;
    this.getState = getState;
  }

  private async redirectTab(tabId: number, url: string) {
    try {
      return await browser.tabs.update(tabId, {
        url,
      });
    } catch (error) {
      log.error('Error redirecting tab:', error);
      return sentry?.captureException(error);
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

    const url = new URL(urlStr);
    const parsed = await parse(url);
    let link: string;
    if (parsed) {
      const skipDeepLinkInterstitial = Boolean(
        this.getState().preferences?.skipDeepLinkInterstitial,
      );

      // only signed links get to skip the interstitial page
      if (parsed.signed && skipDeepLinkInterstitial) {
        link = this.getExtensionURL(
          parsed.destination.path,
          parsed.destination.query.toString(),
        );
      } else {
        const search = new URLSearchParams({
          u: url.pathname + url.search,
        });
        link = this.getExtensionURL(TRIMMED_DEEP_LINK_ROUTE, search.toString());
      }
    } else {
      // unable to parse, show error page
      link = this.getExtensionURL(
        TRIMMED_DEEP_LINK_ROUTE.replace(slashRe, ''),
        new URLSearchParams({
          errorCode: '404',
        }).toString(),
      );
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
