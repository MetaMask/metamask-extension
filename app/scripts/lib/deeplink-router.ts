import browser from 'webextension-polyfill';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  PREPARE_SWAP_ROUTE,
  ADVANCED_ROUTE,
} from '../../../ui/helpers/constants/routes';
import chainList from 'eth-chainlist';

const assetIdRE = /^c(\d+)_t(.*?)$/u;

// https://link.metamask.io/bridge?from=c714_t0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56

const parseUniversalAssetId = (universalAssetId: string | null) => {
  if (!universalAssetId) {
    return null;
  }
  const match = universalAssetId.match(assetIdRE);
  if (!match) {
    return null;
  }
  const chainId = parseInt(match[1], 10);
  const tokenAddress = match[2];

  if (!chainList.rawChainData().find((c) => c.slip44 === chainId)) {
    return null;
  }

  return { chainId, tokenAddress };
};

const { sentry } = global;

const DEEP_LINK_HOST = 'link.metamask.io';
const DEEP_LINK_MAX_LENGTH = 2048;
const pubJwk = {
  crv: 'P-256',
  ext: true,
  key_ops: ['verify'],
  kty: 'EC',
  x: 'Bhp73TQ0keNmZWmdPlT7U3dbqbvZRdywIe5RpVFwIuk',
  y: '4BFtBenx-ZjECrt6YUNRk4isSBTAFMn_21vDiFgI7h8',
};

type RouteHandler = (
  params: URLSearchParams,
) => { path: string; query?: URLSearchParams } | null;

const routes = new Map<string, RouteHandler>([
  [
    '/home',
    function handleHome(params: URLSearchParams) {
      // we don't use `DEFAULT_ROUTE` itself only because '' is prettier than `/`
      return { path: /*DEFAULT_ROUTE*/ '', query: params };
    },
  ],
  [
    '/notifications',
    function handleNotifications(params: URLSearchParams) {
      return { path: NOTIFICATIONS_SETTINGS_ROUTE, query: params };
    },
  ],
  [
    '/swap',
    function handleSwap(params: URLSearchParams) {
      const path = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
      const query = new URLSearchParams();
      query.set('swaps', true.toString());
      return { path, query };
    },
  ],
  [
    '/bridge',
    function handleSwap(params: URLSearchParams) {
      const path = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;

      const query = new URLSearchParams();
      const from = parseUniversalAssetId(params.get('from'));
      const to = parseUniversalAssetId(params.get('to'));

      if (from) {
        query.set('token', from?.tokenAddress || '');
      }
      if (to) {
        query.set('to', to?.tokenAddress || '');
      }
      return { path, query };
    },
  ],
  [
    '/smart-transactions',
    function handleSwap(params: URLSearchParams) {
      // hey, don't blame me for this, someone else wrote the route like this!
      const path = ADVANCED_ROUTE;
      return { path, query: params };
    },
  ],
]);

function canonicalize(url: URL): string {
  url.searchParams.delete('sig');
  const sorted = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return url.origin + url.pathname + (sorted ? `?${sorted}` : '');
}

function b64urlToBytes(str: string) {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const enc = new TextEncoder();

type Options = {
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

  public install() {
    const isManifestV2 = !isManifestV3;
    browser.webRequest.onBeforeRequest.addListener(
      ({ tabId, url }) => {
        if (tabId === browser.tabs.TAB_ID_NONE) {
          return {};
        }

        return this.tryNavigateTo(tabId, url);
      },
      {
        urls: [`http://${DEEP_LINK_HOST}/*`, `https://${DEEP_LINK_HOST}/*`],
        // redirect only top level frames
        types: ['main_frame'],
      },
      isManifestV2 ? ['blocking'] : [],
    );
  }

  verify = async (url: URL) => {
    const pubKey = await crypto.subtle.importKey(
      'jwk',
      pubJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const sigB64 = url.searchParams.get('sig');
    if (!sigB64) return null;

    const canonical = canonicalize(url);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      pubKey,
      b64urlToBytes(sigB64),
      enc.encode(canonical),
    );
    return ok;
  };

  public async tryNavigateTo(
    tabId: number,
    path: string,
  ): Promise<browser.Tabs.Tab | undefined> {
    if (path.length > DEEP_LINK_MAX_LENGTH) {
      console.warn('Path is too long, skipping deeplink handling:', path);
      return;
    }

    const url = new URL(path);

    const isLinkHost = url.host === DEEP_LINK_HOST;
    if (isLinkHost === false) {
      return;
    }
    const isValidSignature = await this.verify(url);
    if (isValidSignature === false) {
      return;
    }

    const publicPath = url.pathname;
    if (isValidSignature === null) {
      // TODO: handle missing signature routing
    }

    const route = routes.get(publicPath);
    if (route) {
      const path = route(url.searchParams);
      if (path) {
        try {
          return this.redirectTab(
            tabId,
            this.getExtensionURL(path.path, path.query?.toString()),
          );
        } catch (error) {
          // tab may have closed in the meantime, and that's okay!
        }
      }
    } else {
      console.error('No handler found for the path:', publicPath);
    }
  }
}
