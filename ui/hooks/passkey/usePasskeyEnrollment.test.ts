import type {
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
} from '@metamask/passkey-controller';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import type { UIMessenger } from '../../messengers/ui-messenger';
import type { RouteMessenger } from '../../messengers/route-messenger';
import {
  cancelPasskeyCeremony,
  isPasskeyPRFSupported,
  startPasskeyAuthentication,
  startPasskeyRegistration,
} from '../../../shared/lib/passkey';
import { usePasskeyEnrollment } from './usePasskeyEnrollment';

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
  clientExtensionResults: {
    prf: {
      enabled: true,
    },
  },
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
  clientExtensionResults: {
    prf: {
      results: {
        first: 'AQ',
      },
    },
  },
};

type RenderHookOptions = {
  uiMessenger?: UIMessenger;
  routeMessenger?: RouteMessenger | false;
};

function renderHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => usePasskeyEnrollment(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('usePasskeyEnrollment', () => {
  const registrationOptions = { challenge: 'registration-challenge' };
  const authenticationOptions = { challenge: 'authentication-challenge' };
  const generateRegistrationOptions = jest
    .fn()
    .mockResolvedValue(registrationOptions);
  const generatePostRegistrationAuthenticationOptions = jest
    .fn()
    .mockResolvedValue(authenticationOptions);
  const protectVaultKeyWithPasskey = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    generateRegistrationOptions.mockResolvedValue(registrationOptions);
    generatePostRegistrationAuthenticationOptions.mockResolvedValue(
      authenticationOptions,
    );
    protectVaultKeyWithPasskey.mockResolvedValue(undefined);
    jest.mocked(isPasskeyPRFSupported).mockResolvedValue(true);
    jest
      .mocked(startPasskeyRegistration)
      .mockResolvedValue(registrationResponse);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
  });

  function renderEnrollmentHook() {
    return renderHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:generateRegistrationOptions':
          generateRegistrationOptions,
        'PasskeyController:generatePostRegistrationAuthenticationOptions':
          generatePostRegistrationAuthenticationOptions,
        'PasskeyController:protectVaultKeyWithPasskey':
          protectVaultKeyWithPasskey,
      }),
    });
  }

  it('runs the complete enrollment ceremony in order', async () => {
    const onStageChange = jest.fn();
    const { result } = renderEnrollmentHook();

    await result.current.enrollWithPasskey({
      password: 'password',
      onStageChange,
    });

    expect(onStageChange.mock.calls).toStrictEqual([
      ['register'],
      ['verify'],
      ['enroll'],
    ]);
    expect(generateRegistrationOptions).toHaveBeenCalledWith({
      prfAvailable: true,
    });
    expect(generatePostRegistrationAuthenticationOptions).toHaveBeenCalledWith({
      registrationResponse,
    });
    expect(protectVaultKeyWithPasskey).toHaveBeenCalledWith({
      registrationResponse,
      authenticationResponse,
      password: 'password',
    });
    expect(startPasskeyRegistration).toHaveBeenCalledWith(registrationOptions);
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
  });

  it('requests registration options without PRF when unsupported', async () => {
    jest.mocked(isPasskeyPRFSupported).mockResolvedValue(false);
    const { result } = renderEnrollmentHook();

    await result.current.enrollWithPasskey();

    expect(generateRegistrationOptions).toHaveBeenCalledWith({
      prfAvailable: false,
    });
  });

  it('preserves enrollment errors and stops at the failing stage', async () => {
    const error = new Error('registration failed');
    jest.mocked(startPasskeyRegistration).mockRejectedValue(error);
    const onStageChange = jest.fn();
    const { result } = renderEnrollmentHook();

    await expect(
      result.current.enrollWithPasskey({ onStageChange }),
    ).rejects.toBe(error);

    expect(onStageChange).toHaveBeenCalledTimes(1);
    expect(onStageChange).toHaveBeenCalledWith('register');
    expect(generateRegistrationOptions).toHaveBeenCalledTimes(1);
    expect(
      generatePostRegistrationAuthenticationOptions,
    ).not.toHaveBeenCalled();
    expect(startPasskeyAuthentication).not.toHaveBeenCalled();
  });

  it('cancels an active ceremony on unmount', () => {
    const { unmount } = renderHook();
    unmount();
    expect(cancelPasskeyCeremony).toHaveBeenCalledTimes(1);
  });

  it('returns a stable enrollment callback across rerenders', () => {
    const { result, rerender } = renderEnrollmentHook();
    const initialCallback = result.current.enrollWithPasskey;

    rerender();

    expect(result.current.enrollWithPasskey).toBe(initialCallback);
  });
});
