import { isProduction } from '../../../shared/lib/environment';

const IGNORED_EXAMPLE_SNAPS = ['npm:@metamask/preinstalled-example-snap'];

/**
 * Check if the given snap ID is ignored in production.
 *
 * @param snapId - The snap ID to check.
 * @returns `true` if the snap ID is ignored in production, and `false` otherwise.
 */
export const isSnapIgnoredInProd = (snapId: string) => {
  return isProduction() ? IGNORED_EXAMPLE_SNAPS.includes(snapId) : false;
};
