import { createApiPlatformClient } from '@metamask/core-backend';
import { isBackendAuthDisabled } from '../../shared/lib/core-backend-api-urls';
import { submitRequestToBackground } from '../store/background-connection';
import './api-client';

jest.mock('../../shared/lib/core-backend-api-urls', () => ({
  getBackendApiUrlsOption: jest.fn(() => ({})),
  isBackendAuthDisabled: jest.fn(() => false),
}));

jest.mock('@metamask/core-backend', () => ({
  createApiPlatformClient: jest.fn(() => ({ accounts: {} })),
}));

jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../contexts/query-client', () => ({
  queryClient: {},
}));

const createApiPlatformClientMock = jest.mocked(createApiPlatformClient);
const isBackendAuthDisabledMock = jest.mocked(isBackendAuthDisabled);
const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

const [firstCallArgs] = createApiPlatformClientMock.mock.calls;
const getBearerToken = firstCallArgs[0].getBearerToken as () => Promise<
  string | undefined
>;

describe('apiClient', () => {
  beforeEach(() => {
    submitRequestToBackgroundMock.mockReset();
    isBackendAuthDisabledMock.mockReset();
    isBackendAuthDisabledMock.mockReturnValue(false);
  });

  it('creates the API platform client with the extension product identifier', () => {
    expect(createApiPlatformClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProduct: 'metamask-extension',
        getBearerToken: expect.any(Function),
      }),
    );
  });

  it('returns the bearer token from the background', async () => {
    submitRequestToBackgroundMock.mockResolvedValueOnce('bearer-token-mock');

    await expect(getBearerToken()).resolves.toBe('bearer-token-mock');
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'getBearerToken',
    );
  });

  it('skips the bearer token when backend auth is disabled', async () => {
    isBackendAuthDisabledMock.mockReturnValueOnce(true);

    await expect(getBearerToken()).resolves.toBeUndefined();
    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();
  });
});
