import { renderHook } from '@testing-library/react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import { usePasskeyPasswordChange } from './usePasskeyPasswordChange';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };

jest.mock('../useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

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

describe('usePasskeyPasswordChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('changes the password through the mutex-protected legacy service', async () => {
    mockCall.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasskeyPasswordChange());
    const params = {
      newPassword: 'new-password',
      authenticationResponse,
      options: { renewVaultKeyProtection: true },
    };

    await result.current(params);

    expect(mockCall).toHaveBeenCalledWith(
      'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
      params,
    );
  });

  it('preserves password-change errors', async () => {
    const error = new Error('password change failed');
    mockCall.mockRejectedValue(error);
    const { result } = renderHook(() => usePasskeyPasswordChange());

    await expect(
      result.current({
        newPassword: 'new-password',
        authenticationResponse,
        options: { renewVaultKeyProtection: false },
      }),
    ).rejects.toBe(error);
  });
});
