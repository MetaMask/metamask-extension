import { renderHook } from '@testing-library/react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import { HIDE_LOADING, SHOW_LOADING } from '../../store/actionConstants';
import { usePasskeyPrivateKeyExport } from './usePasskeyPrivateKeyExport';
import { usePasskeySeedPhraseExport } from './usePasskeySeedPhraseExport';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };
const mockDispatch = jest.fn();

jest.mock('../useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: () => mockDispatch,
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

describe('passkey export hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports private keys in address order with loading state', async () => {
    const privateKeys = ['private-key-1', 'private-key-2'];
    const addresses = ['0x1', '0x2'];
    mockCall.mockResolvedValue(privateKeys);
    const { result } = renderHook(() => usePasskeyPrivateKeyExport());

    await expect(
      result.current(authenticationResponse, addresses),
    ).resolves.toBe(privateKeys);

    expect(mockCall).toHaveBeenCalledWith(
      'PasskeyController:exportAccountsWithPasskey',
      authenticationResponse,
      addresses,
    );
    expect(mockDispatch.mock.calls).toStrictEqual([
      [{ type: SHOW_LOADING, payload: undefined }],
      [{ type: HIDE_LOADING }],
    ]);
  });

  it('hides loading when private-key export fails', async () => {
    const error = new Error('export failed');
    mockCall.mockRejectedValue(error);
    const { result } = renderHook(() => usePasskeyPrivateKeyExport());

    await expect(result.current(authenticationResponse, ['0x1'])).rejects.toBe(
      error,
    );

    expect(mockDispatch).toHaveBeenLastCalledWith({ type: HIDE_LOADING });
  });

  it('exports and decodes a seed phrase for a specific keyring', async () => {
    const encodedSeedPhrase = Array.from(
      new TextEncoder().encode('abandon ability'),
    );
    mockCall.mockResolvedValue(encodedSeedPhrase);
    const { result } = renderHook(() => usePasskeySeedPhraseExport());

    await expect(
      result.current(authenticationResponse, 'keyring-id'),
    ).resolves.toBe('abandon ability');

    expect(mockCall).toHaveBeenCalledWith(
      'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
      { authenticationResponse, keyringId: 'keyring-id' },
    );
  });

  it('omits the keyring id for primary seed phrase export', async () => {
    mockCall.mockResolvedValue(
      Array.from(new TextEncoder().encode('abandon ability')),
    );
    const { result } = renderHook(() => usePasskeySeedPhraseExport());

    await result.current(authenticationResponse);

    expect(mockCall).toHaveBeenCalledWith(
      'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
      { authenticationResponse, keyringId: undefined },
    );
  });
});
