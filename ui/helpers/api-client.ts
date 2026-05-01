import { createApiPlatformClient } from '@metamask/core-backend';
import { queryClient } from '../contexts/query-client';
import { uiMessenger } from '../store/ui-messenger';

type QueryClient = NonNullable<
  Parameters<typeof createApiPlatformClient>[0]['queryClient']
>;

export const apiClient = createApiPlatformClient({
  clientProduct: 'metamask-extension',
  queryClient: queryClient as unknown as QueryClient,
  getBearerToken: () =>
    uiMessenger.call('AuthenticationController:getBearerToken'),
});
