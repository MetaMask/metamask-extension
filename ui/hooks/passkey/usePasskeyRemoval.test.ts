import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import type { UIMessenger } from '../../messengers/ui-messenger';
import type { RouteMessenger } from '../../messengers/route-messenger';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import {
  useRemovePasskeyWithPasskey,
  useRemovePasskeyWithPassword,
} from './usePasskeyRemoval';

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

type RenderHookOptions = {
  uiMessenger?: UIMessenger;
  routeMessenger?: RouteMessenger | false;
};

function renderRemovePasskeyWithPasskeyHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => useRemovePasskeyWithPasskey(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

function renderRemovePasskeyWithPasswordHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => useRemovePasskeyWithPassword(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('usePasskeyRemoval', () => {
  const generateAuthenticationOptions = jest
    .fn()
    .mockResolvedValue(authenticationOptions);
  const removePasskeyWithPasskeyVerification = jest
    .fn()
    .mockResolvedValue(undefined);
  const removePasskeyWithPasswordVerification = jest
    .fn()
    .mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    generateAuthenticationOptions.mockResolvedValue(authenticationOptions);
    removePasskeyWithPasskeyVerification.mockResolvedValue(undefined);
    removePasskeyWithPasswordVerification.mockResolvedValue(undefined);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
  });

  describe('useRemovePasskeyWithPasskey', () => {
    it('authenticates and removes the passkey', async () => {
      const { result } = renderRemovePasskeyWithPasskeyHook({
        routeMessenger: createMockRouteMessenger({
          'PasskeyController:generateAuthenticationOptions':
            generateAuthenticationOptions,
          'PasskeyController:removePasskeyWithPasskeyVerification':
            removePasskeyWithPasskeyVerification,
        }),
      });

      await result.current();

      expect(generateAuthenticationOptions).toHaveBeenCalledTimes(1);
      expect(removePasskeyWithPasskeyVerification).toHaveBeenCalledWith(
        authenticationResponse,
      );
      expect(startPasskeyAuthentication).toHaveBeenCalledWith(
        authenticationOptions,
      );
    });

    it('preserves ceremony errors without removing the passkey', async () => {
      const error = new Error('authentication failed');
      jest.mocked(startPasskeyAuthentication).mockRejectedValue(error);
      const { result } = renderRemovePasskeyWithPasskeyHook({
        routeMessenger: createMockRouteMessenger({
          'PasskeyController:generateAuthenticationOptions':
            generateAuthenticationOptions,
          'PasskeyController:removePasskeyWithPasskeyVerification':
            removePasskeyWithPasskeyVerification,
        }),
      });

      await expect(result.current()).rejects.toBe(error);

      expect(generateAuthenticationOptions).toHaveBeenCalledTimes(1);
      expect(removePasskeyWithPasskeyVerification).not.toHaveBeenCalled();
    });

    it('cancels an active ceremony on unmount', () => {
      const { unmount } = renderRemovePasskeyWithPasskeyHook();
      unmount();
      expect(cancelPasskeyCeremony).toHaveBeenCalledTimes(1);
    });
  });

  describe('useRemovePasskeyWithPassword', () => {
    it('removes the passkey using the password', async () => {
      const { result } = renderRemovePasskeyWithPasswordHook({
        routeMessenger: createMockRouteMessenger({
          'PasskeyController:removePasskeyWithPasswordVerification':
            removePasskeyWithPasswordVerification,
        }),
      });

      await result.current('password');

      expect(removePasskeyWithPasswordVerification).toHaveBeenCalledWith(
        'password',
      );
    });

    it('preserves removal errors', async () => {
      const error = new Error('removal failed');
      removePasskeyWithPasswordVerification.mockRejectedValue(error);
      const { result } = renderRemovePasskeyWithPasswordHook({
        routeMessenger: createMockRouteMessenger({
          'PasskeyController:removePasskeyWithPasswordVerification':
            removePasskeyWithPasswordVerification,
        }),
      });

      await expect(result.current('password')).rejects.toBe(error);
    });
  });
});
