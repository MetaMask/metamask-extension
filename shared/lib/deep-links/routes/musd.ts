import { Route } from './route';

export const MUSD_DEEPLINK_PARAM = 'isDeeplink';

export const musd = new Route({
  pathname: '/earn-musd',
  getTitle: (_: URLSearchParams) => 'deepLink_theMusdEducationPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();
    query.set(MUSD_DEEPLINK_PARAM, 'true');
    params.forEach((value, key) => query.append(key, value));
    return {
      path: '/musd/education',
      query,
    };
  },
});
