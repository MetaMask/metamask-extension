import { SETTINGS_ROUTE, Route } from './route';

export default new Route({
  pathname: '/settings',
  getTitle: (_: URLSearchParams) => 'deepLink_theSettingsPage',
  handler: function handler(params: URLSearchParams) {
    const settingsTab = params.get('tab');

    switch (settingsTab) {
      case 'security':
        return {
          path: `${SETTINGS_ROUTE}/security`,
          query: new URLSearchParams(),
        };
      default:
        return { path: SETTINGS_ROUTE, query: new URLSearchParams() };
    }
  },
});
