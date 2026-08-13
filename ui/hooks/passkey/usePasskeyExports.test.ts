import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import type { UIMessenger } from '../../messengers/ui-messenger';
import type { RouteMessenger } from '../../messengers/route-messenger';
import {
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { usePasskeyPrivateKeyExport } from './usePasskeyPrivateKeyExport';
import { usePasskeySeedPhraseExport } from './usePasskeySeedPhraseExport';

jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    showLoadingIndication: jest.fn(actual.showLoadingIndication),
    hideLoadingIndication: jest.fn(actual.hideLoadingIndication),
  };
});

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

function renderPrivateKeyExportHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => usePasskeyPrivateKeyExport(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

function renderSeedPhraseExportHook({
  uiMessenger = createMockUIMessenger(),
  routeMessenger = createMockRouteMessenger(),
}: RenderHookOptions = {}) {
  return renderHookWithProviderTyped(
    () => usePasskeySeedPhraseExport(),
    {},
    '/',
    undefined,
    jest.fn(),
    uiMessenger,
    routeMessenger,
  );
}

describe('passkey export hooks', () => {
  const exportAccountsWithPasskey = jest.fn();
  const exportSeedPhraseWithPasskey = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports private keys in address order with loading state', async () => {
    const privateKeys = ['private-key-1', 'private-key-2'];
    const addresses = ['0x1', '0x2'];
    exportAccountsWithPasskey.mockResolvedValue(privateKeys);
    const { result } = renderPrivateKeyExportHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:exportAccountsWithPasskey':
          exportAccountsWithPasskey,
      }),
    });

    await expect(
      result.current(authenticationResponse, addresses),
    ).resolves.toBe(privateKeys);

    expect(exportAccountsWithPasskey).toHaveBeenCalledWith(
      authenticationResponse,
      addresses,
    );
    expect(showLoadingIndication).toHaveBeenCalledTimes(1);
    expect(hideLoadingIndication).toHaveBeenCalledTimes(1);
  });

  it('hides loading when private-key export fails', async () => {
    const error = new Error('export failed');
    exportAccountsWithPasskey.mockRejectedValue(error);
    const { result } = renderPrivateKeyExportHook({
      routeMessenger: createMockRouteMessenger({
        'PasskeyController:exportAccountsWithPasskey':
          exportAccountsWithPasskey,
      }),
    });

    await expect(result.current(authenticationResponse, ['0x1'])).rejects.toBe(
      error,
    );

    expect(hideLoadingIndication).toHaveBeenCalledTimes(1);
  });

  it('exports and decodes a seed phrase for a specific keyring', async () => {
    const encodedSeedPhrase = Array.from(
      new TextEncoder().encode('abandon ability'),
    );
    exportSeedPhraseWithPasskey.mockResolvedValue(encodedSeedPhrase);
    const { result } = renderSeedPhraseExportHook({
      routeMessenger: createMockRouteMessenger({
        'LegacyBackgroundApiService:exportSeedPhraseWithPasskey':
          exportSeedPhraseWithPasskey,
      }),
    });

    await expect(
      result.current(authenticationResponse, 'keyring-id'),
    ).resolves.toBe('abandon ability');

    expect(exportSeedPhraseWithPasskey).toHaveBeenCalledWith({
      authenticationResponse,
      keyringId: 'keyring-id',
    });
  });

  it('omits the keyring id for primary seed phrase export', async () => {
    exportSeedPhraseWithPasskey.mockResolvedValue(
      Array.from(new TextEncoder().encode('abandon ability')),
    );
    const { result } = renderSeedPhraseExportHook({
      routeMessenger: createMockRouteMessenger({
        'LegacyBackgroundApiService:exportSeedPhraseWithPasskey':
          exportSeedPhraseWithPasskey,
      }),
    });

    await result.current(authenticationResponse);

    expect(exportSeedPhraseWithPasskey).toHaveBeenCalledWith({
      authenticationResponse,
      keyringId: undefined,
    });
  });
});
