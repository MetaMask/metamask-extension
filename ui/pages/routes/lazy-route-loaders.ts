export type LazyRouteLoader = () => Promise<unknown>;

export const lazyRouteLoaders = {
  home: () => import('../home/home.tsx'),
  unlock: () => import('../unlock-page/index.ts'),
  confirmTransaction: () => import('../confirmations/confirm/confirm.tsx'),
  confirmation: () => import('../confirmations/confirmation/confirmation.js'),
} satisfies Record<string, LazyRouteLoader>;
