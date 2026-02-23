import { createApiPlatformClient } from '@metamask/core-backend';
import { submitRequestToBackground } from '../store/background-connection';
import { queryClient } from '../contexts/query-client';

type QueryClient = NonNullable<
  Parameters<typeof createApiPlatformClient>[0]['queryClient']
>;

export const apiClient = createApiPlatformClient({
  clientProduct: 'metamask-extension',
  queryClient: queryClient as unknown as QueryClient,
  getBearerToken: () =>
    submitRequestToBackground<string | undefined>('getBearerToken'),
});
