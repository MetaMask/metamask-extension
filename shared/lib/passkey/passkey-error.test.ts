import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { JsonRpcError } from '@metamask/rpc-errors';

import { translatePasskeyError } from './passkey-error';

describe('translatePasskeyError', () => {
  const t = (key: string) => `t:${key}`;

  it('maps MetaRPC-style data.cause.code to a translated string', () => {
    const err = new JsonRpcError(-32603, 'internal error', {
      cause: {
        name: 'PasskeyControllerError',
        code: PasskeyControllerErrorCode.AuthenticationVerificationFailed,
      },
    });
    expect(translatePasskeyError(err, t)).toBe(
      't:passkeyErrorAuthenticationVerificationFailed',
    );
  });

  it('maps string `code` on an error-shaped object', () => {
    const err = {
      code: PasskeyControllerErrorCode.NoAuthenticationCeremony,
    };
    expect(translatePasskeyError(err, t)).toBe(
      't:passkeyErrorNoAuthenticationCeremony',
    );
  });

  it('maps root string `code` on a plain object (serialized / test shapes)', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.VaultKeyDecryptionFailed },
        t,
      ),
    ).toBe('t:passkeyErrorVaultKeyDecryptionFailed');
  });

  it('maps a plain object with only `code` (registration verification failed)', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.RegistrationVerificationFailed },
        t,
      ),
    ).toBe('t:passkeyErrorRegistrationVerificationFailed');
  });

  it('returns null when no passkey-specific translation exists', () => {
    expect(translatePasskeyError(new Error('x'), t)).toBeNull();
  });

  it('supports the usual UI fallback with nullish coalescing', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.NoAuthenticationCeremony },
        t,
      ) ?? t('passkeyUnlockFailed'),
    ).toBe('t:passkeyErrorNoAuthenticationCeremony');
    expect(
      translatePasskeyError(new Error('x'), t) ?? t('passkeyUnlockFailed'),
    ).toBe('t:passkeyUnlockFailed');
  });
});
