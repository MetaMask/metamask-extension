import { renderHook } from '@testing-library/react';
import type {
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
} from '@metamask/passkey-controller';
import {
  cancelPasskeyCeremony,
  isPasskeyPRFSupported,
  startPasskeyAuthentication,
  startPasskeyRegistration,
} from '../../../shared/lib/passkey';
import { usePasskeyEnrollment } from './usePasskeyEnrollment';

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
  isPasskeyPRFSupported: jest.fn(),
  startPasskeyAuthentication: jest.fn(),
  startPasskeyRegistration: jest.fn(),
}));

const registrationResponse: PasskeyRegistrationResponse = {
  id: 'credential-id',
  rawId: 'credential-id',
  type: 'public-key',
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation',
  },
  clientExtensionResults: {},
};

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

describe('usePasskeyEnrollment', () => {
  const registrationOptions = { challenge: 'registration-challenge' };
  const authenticationOptions = { challenge: 'authentication-challenge' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isPasskeyPRFSupported).mockResolvedValue(true);
    jest
      .mocked(startPasskeyRegistration)
      .mockResolvedValue(registrationResponse);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
    mockCall.mockImplementation((action: string) => {
      if (action === 'PasskeyController:generateRegistrationOptions') {
        return Promise.resolve(registrationOptions);
      }
      if (
        action ===
        'PasskeyController:generatePostRegistrationAuthenticationOptions'
      ) {
        return Promise.resolve(authenticationOptions);
      }
      if (action === 'PasskeyController:protectVaultKeyWithPasskey') {
        return Promise.resolve(undefined);
      }
      throw new Error(`Unexpected action: ${action}`);
    });
  });

  it('runs the complete enrollment ceremony in order', async () => {
    const onStageChange = jest.fn();
    const { result } = renderHook(() => usePasskeyEnrollment());

    await result.current.enrollWithPasskey({
      password: 'password',
      onStageChange,
    });

    expect(onStageChange.mock.calls).toStrictEqual([
      ['register'],
      ['verify'],
      ['enroll'],
    ]);
    expect(mockCall.mock.calls).toStrictEqual([
      ['PasskeyController:generateRegistrationOptions', { prfAvailable: true }],
      [
        'PasskeyController:generatePostRegistrationAuthenticationOptions',
        { registrationResponse },
      ],
      [
        'PasskeyController:protectVaultKeyWithPasskey',
        {
          registrationResponse,
          authenticationResponse,
          password: 'password',
        },
      ],
    ]);
    expect(startPasskeyRegistration).toHaveBeenCalledWith(registrationOptions);
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
  });

  it('requests registration options without PRF when unsupported', async () => {
    jest.mocked(isPasskeyPRFSupported).mockResolvedValue(false);
    const { result } = renderHook(() => usePasskeyEnrollment());

    await result.current.enrollWithPasskey();

    expect(mockCall).toHaveBeenNthCalledWith(
      1,
      'PasskeyController:generateRegistrationOptions',
      { prfAvailable: false },
    );
  });

  it('preserves enrollment errors and stops at the failing stage', async () => {
    const error = new Error('registration failed');
    jest.mocked(startPasskeyRegistration).mockRejectedValue(error);
    const onStageChange = jest.fn();
    const { result } = renderHook(() => usePasskeyEnrollment());

    await expect(
      result.current.enrollWithPasskey({ onStageChange }),
    ).rejects.toBe(error);

    expect(onStageChange).toHaveBeenCalledTimes(1);
    expect(onStageChange).toHaveBeenCalledWith('register');
    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(startPasskeyAuthentication).not.toHaveBeenCalled();
  });

  it('cancels an active ceremony on unmount', () => {
    const { unmount } = renderHook(() => usePasskeyEnrollment());
    unmount();
    expect(cancelPasskeyCeremony).toHaveBeenCalledTimes(1);
  });

  it('returns a stable enrollment callback across rerenders', () => {
    const { result, rerender } = renderHook(() => usePasskeyEnrollment());
    const initialCallback = result.current.enrollWithPasskey;

    rerender();

    expect(result.current.enrollWithPasskey).toBe(initialCallback);
  });
});
