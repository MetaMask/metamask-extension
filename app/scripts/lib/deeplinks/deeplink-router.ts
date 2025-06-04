import browser from 'webextension-polyfill';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import { DEEPLINK_ROUTE } from '../../../../ui/helpers/constants/routes';
import { parse } from '../../../../shared/lib/deeplinks/parse';
import { DEEP_LINK_HOST } from '../../../../shared/lib/deeplinks/constants';
import MetamaskController from '../../metamask-controller';

const { sentry } = global;

export type Options = {
  getExtensionURL(route?: string | null, queryString?: string | null): string;
  controller: MetamaskController;
};

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
    const parsed = await parse(urlStr);
    if (parsed === false) {
      return {};
    }

    let link: string;
    debugger;

    let skipDeepLinkIntersticial = Boolean(
      this.controller.getState().preferences?.skipDeepLinkIntersticial,
    );

    if (skipDeepLinkIntersticial) {
      link = this.getExtensionURL(
        parsed.destination.path,
        parsed.destination.query.toString(),
      );
    } else {
      const search = new URLSearchParams();
      search.set('u', parsed.url.pathname + parsed.url.search);
      link = this.getExtensionURL(
        // routes.ts seem to require routes have a leading slash, but then the UI
        // always redirects it to the non-slashed version. so we just use the non-slashed
        // version from the start
        DEEPLINK_ROUTE.replace(/^\//, ''),
        search.toString() || null,
      );
    }
    this.redirectTab(tabId, link);
  }
}
