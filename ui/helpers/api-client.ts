import { createApiPlatformClient } from '@metamask/core-backend';
import { getBackendApiUrlsOption } from '../../shared/lib/core-backend-api-urls';
import { submitRequestToBackground } from '../store/background-connection';
import { queryClient } from '../contexts/query-client';

type QueryClient = NonNullable<
  Parameters<typeof createApiPlatformClient>[0]['queryClient']
>;

export const apiClient = createApiPlatformClient({
  clientProduct: 'metamask-extension',
  clientVersion: process.env.METAMASK_VERSION,
  queryClient: queryClient as unknown as QueryClient,
  getBearerToken: () =>
    submitRequestToBackground<string | undefined>('getBearerToken'),
  ...getBackendApiUrlsOption(),
});
