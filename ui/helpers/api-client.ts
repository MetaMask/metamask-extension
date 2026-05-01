import { createApiPlatformClient } from '@metamask/core-backend';
import { submitRequestToBackground } from '../store/background-connection';
import { queryClient } from '../contexts/query-client';

type QueryClient = NonNullable<
  Parameters<typeof createApiPlatformClient>[0]['queryClient']
>;

const GET_BEARER_TOKEN_ACTION = 'AuthenticationController:getBearerToken';

let inFlightGetBearerToken: Promise<string | undefined> | null = null;

function getBearerTokenSingleFlight(): Promise<string | undefined> {
  if (!inFlightGetBearerToken) {
    inFlightGetBearerToken = submitRequestToBackground<string | undefined>(
      'messengerCall',
      [GET_BEARER_TOKEN_ACTION, []],
    ).finally(() => {
      inFlightGetBearerToken = null;
    });
  }
  return inFlightGetBearerToken;
}

export const apiClient = createApiPlatformClient({
  clientProduct: 'metamask-extension',
  queryClient: queryClient as unknown as QueryClient,
  getBearerToken: getBearerTokenSingleFlight,
});
