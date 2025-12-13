import { Route, ZENDESK_URLS } from './route';

export default new Route({
  pathname: '/onboarding',
  getTitle: (_: URLSearchParams) => 'deepLink_theOnboardingPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      redirectTo: new URL(ZENDESK_URLS.IMPORT_ACCOUNT_MOBILE),
    };
  },
});
