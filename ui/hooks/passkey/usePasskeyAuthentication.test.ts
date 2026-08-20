import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import type { UIMessenger } from '../../messengers/ui-messenger';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { startPasskeyAuthentication } from '../../../shared/lib/passkey';
import { usePasskeyAuthentication } from './usePasskeyAuthentication';

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/passkey')>(
    '../../../shared/lib/passkey',
  ),
  startPasskeyAuthentication: jest.fn(),
}));

type RenderHookOptions = {
  uiMessenger?: UIMessenger;
  routeMessenger?: RouteMessenger | false;
};

function renderHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => usePasskeyAuthentication(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('usePasskeyAuthentication', () => {
  it('generates options and runs the passkey ceremony', async () => {
    const authenticationOptions = { challenge: 'challenge' };
    const authenticationResponse = { id: 'credential-id' };
    const generateAuthenticationOptions = jest
      .fn()
      .mockResolvedValue(authenticationOptions);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse as never);
    const { result } = renderHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:generateAuthenticationOptions':
          generateAuthenticationOptions,
      }),
    });

    await expect(result.current()).resolves.toBe(authenticationResponse);

    expect(generateAuthenticationOptions).toHaveBeenCalledTimes(1);
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
  });
});
