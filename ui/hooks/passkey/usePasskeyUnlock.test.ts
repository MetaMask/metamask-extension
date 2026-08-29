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
  forceUpdateMetamaskState,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { usePasskeyUnlock } from './usePasskeyUnlock';

jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    forceUpdateMetamaskState: jest.fn(),
    showLoadingIndication: jest.fn(actual.showLoadingIndication),
    hideLoadingIndication: jest.fn(actual.hideLoadingIndication),
  };
});

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

function renderHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => usePasskeyUnlock(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('usePasskeyUnlock', () => {
  const generateAuthenticationOptions = jest
    .fn()
    .mockResolvedValue(authenticationOptions);
  const unlockWithPasskey = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    generateAuthenticationOptions.mockResolvedValue(authenticationOptions);
    unlockWithPasskey.mockResolvedValue(undefined);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
    jest.mocked(forceUpdateMetamaskState).mockResolvedValue(undefined);
  });

  it('authenticates, unlocks through the legacy service, and refreshes state', async () => {
    const { result, store } = renderHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:generateAuthenticationOptions':
          generateAuthenticationOptions,
        'LegacyBackgroundApiService:unlockWithPasskey': unlockWithPasskey,
      }),
    });

    await result.current();

    expect(generateAuthenticationOptions).toHaveBeenCalledTimes(1);
    expect(unlockWithPasskey).toHaveBeenCalledWith(authenticationResponse);
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
    expect(forceUpdateMetamaskState).toHaveBeenCalledWith(store.dispatch);
    expect(showLoadingIndication).toHaveBeenCalledTimes(1);
    expect(hideLoadingIndication).toHaveBeenCalledTimes(1);
  });

  it('hides loading and preserves unlock errors', async () => {
    const error = new Error('unlock failed');
    unlockWithPasskey.mockRejectedValue(error);
    const { result } = renderHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:generateAuthenticationOptions':
          generateAuthenticationOptions,
        'LegacyBackgroundApiService:unlockWithPasskey': unlockWithPasskey,
      }),
    });

    await expect(result.current()).rejects.toBe(error);

    expect(forceUpdateMetamaskState).not.toHaveBeenCalled();
    expect(hideLoadingIndication).toHaveBeenCalledTimes(1);
  });

  it('does not show loading when the ceremony fails', async () => {
    const error = new Error('authentication failed');
    jest.mocked(startPasskeyAuthentication).mockRejectedValue(error);
    const { result } = renderHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:generateAuthenticationOptions':
          generateAuthenticationOptions,
      }),
    });

    await expect(result.current()).rejects.toBe(error);

    expect(showLoadingIndication).not.toHaveBeenCalled();
    expect(unlockWithPasskey).not.toHaveBeenCalled();
    expect(generateAuthenticationOptions).toHaveBeenCalledTimes(1);
  });

  it('cancels an active ceremony on unmount', () => {
    const { unmount } = renderHook();
    unmount();
    expect(cancelPasskeyCeremony).toHaveBeenCalledTimes(1);
  });
});
