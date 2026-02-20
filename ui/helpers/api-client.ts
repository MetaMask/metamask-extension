import { createApiPlatformClient } from '@metamask/core-backend';
import { submitRequestToBackground } from '../store/background-connection';

export const apiClient = createApiPlatformClient({
  clientProduct: 'metamask-extension',
  getBearerToken: () =>
    submitRequestToBackground<string | undefined>('getBearerToken'),
});
