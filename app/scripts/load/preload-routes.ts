// currently only used in webpack build.

// eslint-disable-next-line import-x/no-restricted-paths
import { getLikelyPreloadLoadersFromLocation } from '../../../ui/pages/routes/preload-route-config';

getLikelyPreloadLoadersFromLocation(globalThis.location).forEach((loadRoute) => {
  loadRoute().catch(() => undefined);
});
