import { renderHook } from '@testing-library/react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import {
  useRemovePasskeyWithPasskey,
  useRemovePasskeyWithPassword,
} from './usePasskeyRemoval';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };

jest.mock('../useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/passkey')>(
    '../../../shared/lib/passkey',
  ),
  cancelPasskeyCeremony: jest.fn(),
  startPasskeyAuthentication: jest.fn(),
}));

const authenticationOptions = { challenge: 'authentication-challenge' };
const authenticationResponse: PasskeyAuthenticationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  response: {
    clientDataJSON: 'client-data',
    authenticatorData: 'authenticator-data',
    signature: 'signature',
  },
  clientExtensionResults: {},
};

describe('usePasskeyRemoval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
  });

  describe('useRemovePasskeyWithPasskey', () => {
    it('authenticates and removes the passkey', async () => {
      mockCall
        .mockResolvedValueOnce(authenticationOptions)
        .mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useRemovePasskeyWithPasskey());

      await result.current();

      expect(mockCall.mock.calls).toStrictEqual([
        ['PasskeyController:generateAuthenticationOptions'],
        [
          'PasskeyController:removePasskeyWithPasskeyVerification',
          authenticationResponse,
        ],
      ]);
      expect(startPasskeyAuthentication).toHaveBeenCalledWith(
        authenticationOptions,
      );
    });

    it('preserves ceremony errors without removing the passkey', async () => {
      const error = new Error('authentication failed');
      mockCall.mockResolvedValueOnce(authenticationOptions);
      jest.mocked(startPasskeyAuthentication).mockRejectedValue(error);
      const { result } = renderHook(() => useRemovePasskeyWithPasskey());

      await expect(result.current()).rejects.toBe(error);

      expect(mockCall).toHaveBeenCalledTimes(1);
    });

    it('cancels an active ceremony on unmount', () => {
      const { unmount } = renderHook(() => useRemovePasskeyWithPasskey());
      unmount();
      expect(cancelPasskeyCeremony).toHaveBeenCalledTimes(1);
    });
  });

  describe('useRemovePasskeyWithPassword', () => {
    it('removes the passkey using the password', async () => {
      mockCall.mockResolvedValue(undefined);
      const { result } = renderHook(() => useRemovePasskeyWithPassword());

      await result.current('password');

      expect(mockCall).toHaveBeenCalledWith(
        'PasskeyController:removePasskeyWithPasswordVerification',
        'password',
      );
    });

    it('preserves removal errors', async () => {
      const error = new Error('removal failed');
      mockCall.mockRejectedValue(error);
      const { result } = renderHook(() => useRemovePasskeyWithPassword());

      await expect(result.current('password')).rejects.toBe(error);
    });
  });
});
