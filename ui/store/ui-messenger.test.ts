import { submitRequestToBackground } from './background-connection';
import { uiMessenger } from './ui-messenger';

jest.mock('./background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

describe('uiMessenger', () => {
  beforeEach(() => {
    submitRequestToBackgroundMock.mockReset();
  });

  describe('call for AuthenticationController:getBearerToken', () => {
    it('deduplicates concurrent calls into a single messengerCall', async () => {
      let resolveBackground: (value: string) => void;
      const backgroundPromise = new Promise<string>((resolve) => {
        resolveBackground = resolve;
      });
      submitRequestToBackgroundMock.mockReturnValue(
        backgroundPromise as unknown as Promise<string | undefined>,
      );

      const p1 = uiMessenger.call('AuthenticationController:getBearerToken');
      const p2 = uiMessenger.call('AuthenticationController:getBearerToken');

      expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(1);
      expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
        'messengerCall',
        ['AuthenticationController:getBearerToken', []],
      );

      resolveBackground!('jwt');
      await expect(Promise.all([p1, p2])).resolves.toEqual(['jwt', 'jwt']);
    });

    it('allows a new background call after the previous token request settles', async () => {
      submitRequestToBackgroundMock
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second');

      await expect(
        uiMessenger.call('AuthenticationController:getBearerToken'),
      ).resolves.toBe('first');
      await expect(
        uiMessenger.call('AuthenticationController:getBearerToken'),
      ).resolves.toBe('second');

      expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(2);
    });
  });
});
