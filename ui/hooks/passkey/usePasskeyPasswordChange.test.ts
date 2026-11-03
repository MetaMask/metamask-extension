import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import type { UIMessenger } from '../../messengers/ui-messenger';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { usePasskeyPasswordChange } from './usePasskeyPasswordChange';

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

function renderHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => usePasskeyPasswordChange(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('usePasskeyPasswordChange', () => {
  const changePasswordWithPasskeyVerification = jest
    .fn()
    .mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    changePasswordWithPasskeyVerification.mockResolvedValue(undefined);
  });

  it('changes the password through the mutex-protected legacy service', async () => {
    const { result } = renderHook({
      routeMessenger: createMockRouteMessenger({
        'LegacyBackgroundApiService:changePasswordWithPasskeyVerification':
          changePasswordWithPasskeyVerification,
      }),
    });
    const params = {
      newPassword: 'new-password',
      authenticationResponse,
      options: { renewVaultKeyProtection: true },
    };

    await result.current(params);

    expect(changePasswordWithPasskeyVerification).toHaveBeenCalledWith(params);
  });

  it('preserves password-change errors', async () => {
    const error = new Error('password change failed');
    changePasswordWithPasskeyVerification.mockRejectedValue(error);
    const { result } = renderHook({
      routeMessenger: createMockRouteMessenger({
        'LegacyBackgroundApiService:changePasswordWithPasskeyVerification':
          changePasswordWithPasskeyVerification,
      }),
    });

    await expect(
      result.current({
        newPassword: 'new-password',
        authenticationResponse,
        options: { renewVaultKeyProtection: false },
      }),
    ).rejects.toBe(error);
  });
});
