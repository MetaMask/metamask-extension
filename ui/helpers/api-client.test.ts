import { submitRequestToBackground } from '../store/background-connection';

jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

describe('apiClient getBearerToken', () => {
  beforeEach(() => {
    jest.resetModules();
    submitRequestToBackgroundMock.mockReset();
  });

  it('deduplicates concurrent getBearerToken calls into one messengerCall', async () => {
    let resolveCall: (value: string) => void;
    const pending = new Promise<string>((resolve) => {
      resolveCall = resolve;
    });
    submitRequestToBackgroundMock.mockReturnValue(
      pending as unknown as Promise<string | undefined>,
    );

    const { apiClient } = await import('./api-client');

    const p1 = apiClient.getBearerToken();
    const p2 = apiClient.getBearerToken();

    expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(1);
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith('messengerCall', [
      'AuthenticationController:getBearerToken',
      [],
    ]);

    resolveCall!('jwt');
    await expect(Promise.all([p1, p2])).resolves.toEqual(['jwt', 'jwt']);
  });

  it('starts a new background request after the previous in-flight completes', async () => {
    submitRequestToBackgroundMock
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const { apiClient } = await import('./api-client');

    await expect(apiClient.getBearerToken()).resolves.toBe('first');
    await expect(apiClient.getBearerToken()).resolves.toBe('second');

    expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(2);
  });
});
