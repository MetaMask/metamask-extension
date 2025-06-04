import browser from 'webextension-polyfill';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { DEEPLINK_ROUTE } from '../../../../ui/helpers/constants/routes';
import { parse } from '../../../../shared/lib/deeplinks/parse';
import { DEEP_LINK_HOST } from '../../../../shared/lib/deeplinks/constants';
import MetamaskController from '../../metamask-controller';

const { sentry } = global;

export type Options = {
  getExtensionURL(route?: string | null, queryString?: string | null): string;
  controller: MetamaskController;
};

const slashRe = /^\//u;

export class DeeplinkRouter {
  private getExtensionURL: Options['getExtensionURL'];

  private controller: MetamaskController;

  constructor({ getExtensionURL, controller }: Options) {
    this.getExtensionURL = getExtensionURL;
    this.controller = controller;
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

  public async tryNavigateTo(
    tabId: number,
    urlStr: string,
  ): Promise<browser.WebRequest.BlockingResponse> {
    const parsed = await parse(urlStr);
    if (parsed === false) {
      // unable to parse, ignore the request
      return {};
    }

    let link: string;

    const skipDeepLinkIntersticial = Boolean(
      this.controller.getState().preferences?.skipDeepLinkIntersticial,
    );

    if (skipDeepLinkIntersticial) {
      link = this.getExtensionURL(
        parsed.destination.path,
        parsed.destination.query.toString(),
      );
    } else {
      const search = new URLSearchParams({
        u: parsed.normalizedUrl.pathname + parsed.normalizedUrl.search,
      });
      link = this.getExtensionURL(
        // `routes.ts` seem to require routes have a leading slash, but then the
        // UI always redirects it to the non-slashed version. So we just use the
        // non-slashed version here to skip that redirect step.
        DEEPLINK_ROUTE.replace(slashRe, ''),
        search.toString() || null,
      );
    }

    if (isManifestV3) {
      // We need to use the redirect API in MV3, because the webRequest API does
      // not support blocking redirects.
      this.redirectTab(tabId, link);
      return {};
    }
    // In MV2 we can just return the redirect URL, and the browser will
    // redirect the tab to it for us, without letting the request to even
    // begin.
    // This is better because it avoids any network requests to the deeplink
    // host, which is not needed in this case.
    return { redirectUrl: link };
  }
}
