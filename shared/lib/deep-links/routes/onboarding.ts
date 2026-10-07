// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import ZENDESK_URLS from '../../../../ui/helpers/constants/zendesk-url';
import { Route } from './route';

export const onboarding = new Route({
  pathname: '/onboarding',
  getTitle: (_: URLSearchParams) => 'deepLink_theOnboardingPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      redirectTo: new URL(ZENDESK_URLS.IMPORT_ACCOUNT_MOBILE),
    };
  },
});
