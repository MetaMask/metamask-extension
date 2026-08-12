import { renderHook } from '@testing-library/react';
import { startPasskeyAuthentication } from '../../../shared/lib/passkey';
import { usePasskeyAuthentication } from './usePasskeyAuthentication';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };

jest.mock('../useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

jest.mock('../../../shared/lib/passkey', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/passkey')>(
    '../../../shared/lib/passkey',
  ),
  startPasskeyAuthentication: jest.fn(),
}));

describe('usePasskeyAuthentication', () => {
  it('generates options and runs the passkey ceremony', async () => {
    const authenticationOptions = { challenge: 'challenge' };
    const authenticationResponse = { id: 'credential-id' };
    mockCall.mockResolvedValue(authenticationOptions);
    jest
      .mocked(startPasskeyAuthentication)
      .mockResolvedValue(authenticationResponse as never);
    const { result } = renderHook(() => usePasskeyAuthentication());

    await expect(result.current()).resolves.toBe(authenticationResponse);

    expect(mockCall).toHaveBeenCalledWith(
      'PasskeyController:generateAuthenticationOptions',
    );
    expect(startPasskeyAuthentication).toHaveBeenCalledWith(
      authenticationOptions,
    );
  });
});
