export const featureFlag = 'cashtagInjection';

export const supportedHosts = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
]);

export const swapRoute = '/cross-chain/swaps/prepare-bridge-page';

export function swapRouteSearchForDest(caipAssetId: string): `?${string}` {
  // Same query shape as deep links / useBridging destTokenAssetId.
  return `?to=${encodeURIComponent(caipAssetId)}`;
}
