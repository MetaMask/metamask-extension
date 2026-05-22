export type LazyRouteLoader = () => Promise<unknown>;

export const lazyRouteLoaders = {
  home: () => import('../home'),
  unlock: () => import('../unlock-page'),
  confirmTransaction: () => import('../confirmations/confirm/confirm'),
  confirmation: () => import('../confirmations/confirmation'),
} satisfies Record<string, LazyRouteLoader>;
