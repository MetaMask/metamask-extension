import { lazyRouteLoaders, type LazyRouteLoader } from './lazy-route-loaders';

export const PRELOAD_ROUTE_PATHS = {
  default: '/',
  unlock: '/unlock',
  confirmTransaction: '/confirm-transaction',
  confirmation: '/confirmation',
} as const;

type PreloadRouteConfig = {
  path?: string;
  pathPrefix?: string;
  loader: LazyRouteLoader;
};

const preloadRouteConfig: PreloadRouteConfig[] = [
  { path: PRELOAD_ROUTE_PATHS.default, loader: lazyRouteLoaders.home },
  { path: PRELOAD_ROUTE_PATHS.unlock, loader: lazyRouteLoaders.unlock },
  {
    pathPrefix: PRELOAD_ROUTE_PATHS.confirmTransaction,
    loader: lazyRouteLoaders.confirmTransaction,
  },
  {
    pathPrefix: PRELOAD_ROUTE_PATHS.confirmation,
    loader: lazyRouteLoaders.confirmation,
  },
];

export type PreloadLocation = Pick<Location, 'hash' | 'pathname'>;

export function getLikelyPreloadLoadersFromLocation({
  hash,
  pathname,
}: PreloadLocation): LazyRouteLoader[] {
  const hashPathname = getPathnameFromHash(hash);

  if (hashPathname === PRELOAD_ROUTE_PATHS.default) {
    return getDefaultRoutePreloadLoaders(pathname);
  }

  return getPreloadLoadersFromPathname(hashPathname);
}

export function getPathnameFromHash(hash: string): string {
  if (!hash || hash === '#') {
    return PRELOAD_ROUTE_PATHS.default;
  }

  const hashPath = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathname] = hashPath.split(/[?#]/u);

  if (!pathname || pathname === '/') {
    return PRELOAD_ROUTE_PATHS.default;
  }

  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function getPreloadLoadersFromPathname(pathname: string): LazyRouteLoader[] {
  const matchedRoute = preloadRouteConfig.find((route) => {
    if (route.path) {
      return pathname === route.path;
    }

    return (
      pathname === route.pathPrefix ||
      pathname.startsWith(`${route.pathPrefix}/`)
    );
  });

  return matchedRoute ? [matchedRoute.loader] : [];
}

function getDefaultRoutePreloadLoaders(pathname: string): LazyRouteLoader[] {
  if (pathname.endsWith('/notification.html')) {
    return [
      lazyRouteLoaders.confirmTransaction,
      lazyRouteLoaders.confirmation,
      lazyRouteLoaders.unlock,
    ];
  }

  return [lazyRouteLoaders.home, lazyRouteLoaders.unlock];
}
