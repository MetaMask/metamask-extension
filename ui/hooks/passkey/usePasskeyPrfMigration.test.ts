import type {
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
} from '@metamask/passkey-controller';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import type { RouteMessenger } from '../../messengers/route-messenger';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
  startPasskeyRegistration,
} from '../../../shared/lib/passkey';
import { PasskeyPRFRequiredError } from '../../../shared/lib/passkey/passkey-capabilities';
import { forceUpdateMetamaskState } from '../../store/actions';
import { usePasskeyPrfMigration } from './usePasskeyPrfMigration';

jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    forceUpdateMetamaskState: jest.fn(),
  };
});

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/passkey')>(
    '../../../shared/lib/passkey',
  ),
  cancelPasskeyCeremony: jest.fn(),
  startPasskeyAuthentication: jest.fn(),
  startPasskeyRegistration: jest.fn(),
}));

const registrationResponse: PasskeyRegistrationResponse = {
  id: 'replacement-credential-id',
  rawId: 'replacement-credential-id',
  type: 'public-key',
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation',
  },
  clientExtensionResults: {
    prf: { enabled: true },
  },
};

const authenticationResponse: PasskeyAuthenticationResponse = {
  id: 'replacement-credential-id',
  rawId: 'replacement-credential-id',
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

type ReplacementMessenger = RouteMessenger<
  | 'PasskeyController:generatePasskeyReplacementRegistrationOptions'
  | 'PasskeyController:generatePostRegistrationAuthenticationOptions'
  | 'PasskeyController:completePasskeyReplacement'
  | 'PasskeyController:cancelPasskeyReplacement',
  never
>;

function renderReplacementHook(routeMessenger: ReplacementMessenger) {
  return renderHookWithProviderTyped(
    () => usePasskeyPrfMigration(),
    {},
    '/',
    undefined,
    jest.fn(),
    undefined,
    routeMessenger,
  );
}

describe('usePasskeyPrfMigration', () => {
  const registrationOptions = { challenge: 'registration-challenge' };
  const authenticationOptions = { challenge: 'authentication-challenge' };
  const generatePasskeyReplacementRegistrationOptions = jest
    .fn()
    .mockResolvedValue(registrationOptions);
  const generatePostRegistrationAuthenticationOptions = jest
    .fn()
    .mockResolvedValue(authenticationOptions);
  const completePasskeyReplacement = jest.fn().mockResolvedValue(undefined);
  const cancelPasskeyReplacement = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    generatePasskeyReplacementRegistrationOptions.mockResolvedValue(
      registrationOptions,
    );
    generatePostRegistrationAuthenticationOptions.mockResolvedValue(
      authenticationOptions,
    );
    completePasskeyReplacement.mockResolvedValue(undefined);
    cancelPasskeyReplacement.mockResolvedValue(undefined);
    jest.mocked(forceUpdateMetamaskState).mockResolvedValue(undefined);
    jest
      .mocked(startPasskeyRegistration)
      .mockResolvedValue(registrationResponse);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
  });

  function renderReplacementFlow() {
    return renderReplacementHook(
      createMockRouteMessenger({
        'PasskeyController:generatePasskeyReplacementRegistrationOptions':
          generatePasskeyReplacementRegistrationOptions,
        'PasskeyController:generatePostRegistrationAuthenticationOptions':
          generatePostRegistrationAuthenticationOptions,
        'PasskeyController:completePasskeyReplacement':
          completePasskeyReplacement,
        'PasskeyController:cancelPasskeyReplacement': cancelPasskeyReplacement,
      }) as ReplacementMessenger,
    );
  }

  it('runs registration, verification, and atomic replacement in order', async () => {
    const onStageChange = jest.fn();
    const { result } = renderReplacementFlow();

    await result.current.replacePasskey({ onStageChange });

    expect(onStageChange.mock.calls).toStrictEqual([
      ['register'],
      ['verify'],
      ['complete'],
    ]);
    expect(
      generatePasskeyReplacementRegistrationOptions,
    ).toHaveBeenCalledWith();
    expect(generatePostRegistrationAuthenticationOptions).toHaveBeenCalledWith({
      registrationResponse,
    });
    expect(completePasskeyReplacement).toHaveBeenCalledWith({
      registrationResponse,
      authenticationResponse,
    });
    expect(startPasskeyRegistration).toHaveBeenCalledWith(registrationOptions);
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
    expect(cancelPasskeyReplacement).not.toHaveBeenCalled();
  });

  it('cancels the controller ceremony when the response has no PRF output', async () => {
    jest.mocked(startPasskeyAuthentication).mockResolvedValueOnce({
      ...authenticationResponse,
      clientExtensionResults: {},
    });
    const { result } = renderReplacementFlow();

    await expect(result.current.replacePasskey()).rejects.toBeInstanceOf(
      PasskeyPRFRequiredError,
    );

    expect(cancelPasskeyReplacement).toHaveBeenCalledWith(
      registrationOptions.challenge,
    );
    expect(completePasskeyReplacement).not.toHaveBeenCalled();
  });

  it('cancels the controller ceremony when browser registration fails', async () => {
    const error = new Error('registration failed');
    jest.mocked(startPasskeyRegistration).mockRejectedValueOnce(error);
    const { result } = renderReplacementFlow();

    await expect(result.current.replacePasskey()).rejects.toBe(error);

    expect(cancelPasskeyReplacement).toHaveBeenCalledWith(
      registrationOptions.challenge,
    );
  });

  it('cancels the controller ceremony when unmount happens before the registration challenge is stored', async () => {
    let resolveGenerate: (options: typeof registrationOptions) => void = () =>
      undefined;
    generatePasskeyReplacementRegistrationOptions.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      }),
    );
    const { result, unmount } = renderReplacementFlow();

    act(() => {
      result.current.replacePasskey().catch(() => undefined);
    });
    await waitFor(() => {
      expect(generatePasskeyReplacementRegistrationOptions).toHaveBeenCalled();
    });

    unmount();

    expect(cancelPasskeyReplacement).not.toHaveBeenCalled();

    await act(async () => {
      resolveGenerate(registrationOptions);
    });

    await waitFor(() => {
      expect(cancelPasskeyReplacement).toHaveBeenCalledWith(
        registrationOptions.challenge,
      );
    });
    expect(startPasskeyRegistration).not.toHaveBeenCalled();
  });

  it('cancels active replacement when the hook unmounts', async () => {
    let resolveRegistration: (
      response: PasskeyRegistrationResponse,
    ) => void = () => undefined;
    jest.mocked(startPasskeyRegistration).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegistration = resolve;
      }),
    );
    const { result, unmount } = renderReplacementFlow();

    act(() => {
      result.current.replacePasskey().catch(() => undefined);
    });
    await waitFor(() => {
      expect(startPasskeyRegistration).toHaveBeenCalled();
    });

    unmount();

    expect(cancelPasskeyCeremony).toHaveBeenCalled();
    expect(cancelPasskeyReplacement).toHaveBeenCalledWith(
      registrationOptions.challenge,
    );
    resolveRegistration(registrationResponse);
  });
});
