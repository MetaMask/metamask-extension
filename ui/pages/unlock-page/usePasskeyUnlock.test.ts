import { renderHook } from '@testing-library/react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import { HIDE_LOADING, SHOW_LOADING } from '../../store/actionConstants';
import { forceUpdateMetamaskState } from '../../store/actions';
import { UNLOCK_ROUTE_CAPABILITIES } from './messenger';
import { usePasskeyUnlock } from './usePasskeyUnlock';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };
const mockDispatch = jest.fn();

jest.mock('../../hooks/useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  forceUpdateMetamaskState: jest.fn(),
}));

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

describe('usePasskeyUnlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse);
    jest.mocked(forceUpdateMetamaskState).mockResolvedValue(undefined);
    mockCall
      .mockResolvedValueOnce(authenticationOptions)
      .mockResolvedValueOnce(undefined);
  });

  it('allows only the actions required for passkey unlock', () => {
    expect(UNLOCK_ROUTE_CAPABILITIES).toStrictEqual({
      actions: [
        'PasskeyController:generateAuthenticationOptions',
        'LegacyBackgroundApiService:unlockWithPasskey',
      ],
      events: [],
    });
  });

  it('authenticates, unlocks through the legacy service, and refreshes state', async () => {
    const { result } = renderHook(() => usePasskeyUnlock());

    await result.current();

    expect(mockCall.mock.calls).toStrictEqual([
      ['PasskeyController:generateAuthenticationOptions'],
      ['LegacyBackgroundApiService:unlockWithPasskey', authenticationResponse],
    ]);
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
    expect(forceUpdateMetamaskState).toHaveBeenCalledWith(mockDispatch);
    expect(mockDispatch.mock.calls).toStrictEqual([
      [{ type: SHOW_LOADING, payload: undefined }],
      [{ type: HIDE_LOADING }],
    ]);
  });

  it('hides loading and preserves unlock errors', async () => {
    const error = new Error('unlock failed');
    mockCall
      .mockReset()
      .mockResolvedValueOnce(authenticationOptions)
      .mockRejectedValueOnce(error);
    const { result } = renderHook(() => usePasskeyUnlock());

    await expect(result.current()).rejects.toBe(error);

    expect(forceUpdateMetamaskState).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: HIDE_LOADING });
  });

  it('does not show loading when the ceremony fails', async () => {
    const error = new Error('authentication failed');
    jest.mocked(startPasskeyAuthentication).mockRejectedValue(error);
    const { result } = renderHook(() => usePasskeyUnlock());

    await expect(result.current()).rejects.toBe(error);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockCall).toHaveBeenCalledTimes(1);
  });

  it('cancels an active ceremony on unmount', () => {
    const { unmount } = renderHook(() => usePasskeyUnlock());
    unmount();
    expect(cancelPasskeyCeremony).toHaveBeenCalledTimes(1);
  });
});
