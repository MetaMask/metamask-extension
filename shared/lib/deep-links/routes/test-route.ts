import { DEVELOPER_OPTIONS_ROUTE, Route } from './route';

export default new Route({
  pathname: '/test',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(params: URLSearchParams) {
    return {
      // we use the developer options route for testing purposes
      // because it doesn't require any special permissions to access
      path: DEVELOPER_OPTIONS_ROUTE,
      query: params,
    };
  },
});
