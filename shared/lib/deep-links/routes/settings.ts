import { SETTINGS_ROUTE, Route } from './route';

export default new Route({
  pathname: '/settings',
  getTitle: (_: URLSearchParams) => 'deepLink_theSettingsPage',
  handler: function handler(_: URLSearchParams) {
    return { path: SETTINGS_ROUTE, query: new URLSearchParams() };
  },
});
