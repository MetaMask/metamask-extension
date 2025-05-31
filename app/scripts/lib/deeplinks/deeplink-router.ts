import browser from 'webextension-polyfill';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import { DEEPLINK_ROUTE } from '../../../../ui/helpers/constants/routes';
import { parse } from '../../../../shared/lib/deeplinks/parse';
import { DEEP_LINK_HOST } from '../../../../shared/lib/deeplinks/constants';

const { sentry } = global;

export type Options = {
  getExtensionURL(route?: string | null, queryString?: string | null): string;
};

export class DeeplinkRouter {
  private static instance: DeeplinkRouter;
  private getExtensionURL: Options['getExtensionURL'];

  private constructor({ getExtensionURL }: Options) {
    this.getExtensionURL = getExtensionURL;
  }

  public static getInstance(options: Options): DeeplinkRouter {
    if (!DeeplinkRouter.instance) {
      DeeplinkRouter.instance = new DeeplinkRouter(options);
    }
    return DeeplinkRouter.instance;
  }

  public async redirectTab(tabId: number, url: string) {
    try {
      return await browser.tabs.update(tabId, {
        url,
      });
    } catch (error) {
      return sentry?.captureException(error);
    }
  }

  private handleBeforeRequest = ({
    tabId,
    url,
  }: browser.WebRequest.OnBeforeRequestDetailsType) => {
    if (tabId === browser.tabs.TAB_ID_NONE) {
      return {};
    }

    return this.tryNavigateTo(tabId, url);
  };

  public install() {
    const isManifestV2 = !isManifestV3;
    browser.webRequest.onBeforeRequest.addListener(
      this.handleBeforeRequest,
      {
        urls: [`*://*.${DEEP_LINK_HOST}/*`],
        // redirect only top level frames, ignore all others.
        types: ['main_frame'],
      },
      // blocking is only in MV2, but is better because it lets us completely
      // replace the URL before any requests are made.
      isManifestV2 ? ['blocking'] : [],
    );
  }

  public uninstall() {
    browser.webRequest.onBeforeRequest.removeListener(this.handleBeforeRequest);
  }

  public async tryNavigateTo(tabId: number, urlStr: string) {
    const destination = await parse(urlStr);
    if (destination === false) {
      return {};
    }
    const search = new URLSearchParams();
    search.set('u', destination.url.pathname + destination.url.search);

    const interstitial = this.getExtensionURL(
      // routes.ts seem to require routes have a leading slash, but then the UI
      // always redirects it to the non-slashed version. so we just use the non-slashed
      // version from the start
      DEEPLINK_ROUTE.replace(/^\//, ''),
      search.toString() || null,
    );
    this.redirectTab(tabId, interstitial);
  }
}
