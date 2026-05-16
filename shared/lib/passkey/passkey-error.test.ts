import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { JsonRpcError } from '@metamask/rpc-errors';

import { PasskeyCeremonyTimeoutError } from './passkey-ceremony';
import {
  ExtensionPasskeyErrorCode,
  getPasskeyErrorCode,
  getPasskeyControllerErrorCode,
  translatePasskeyError,
} from './passkey-error';

describe('translatePasskeyError', () => {
  const t = (key: string, substitutions?: string[]) =>
    substitutions === undefined
      ? `t:${key}`
      : `t:${key}(${substitutions.join(',')})`;
  const label = 'Biometrics';

  it('maps MetaRPC-style data.cause.code to a translated string', () => {
    const err = new JsonRpcError(-32603, 'internal error', {
      cause: {
        name: 'PasskeyControllerError',
        code: PasskeyControllerErrorCode.AuthenticationVerificationFailed,
      },
    });
    expect(translatePasskeyError(err, t, label)).toBe(
      't:passkeyErrorAuthenticationVerificationFailed(Biometrics)',
    );
  });

  it('maps string `code` on an error-shaped object', () => {
    const err = {
      code: PasskeyControllerErrorCode.NoAuthenticationCeremony,
    };
    expect(translatePasskeyError(err, t, label)).toBe(
      't:passkeyErrorNoAuthenticationCeremony(Biometrics)',
    );
  });

  it('maps root string `code` on a plain object (serialized / test shapes)', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.VaultKeyDecryptionFailed },
        t,
        label,
      ),
    ).toBe('t:passkeyErrorVaultKeyDecryptionFailed(Biometrics)');
  });

  it('maps a plain object with only `code` (registration verification failed)', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.RegistrationVerificationFailed },
        t,
        label,
      ),
    ).toBe('t:passkeyErrorRegistrationVerificationFailed(Biometrics)');
  });

  it('maps already enrolled code', () => {
    expect(
      translatePasskeyError(
        {
          code: PasskeyControllerErrorCode.AlreadyEnrolled,
        },
        t,
        label,
      ),
    ).toBe('t:passkeyErrorAlreadyEnrolled(Biometrics)');
  });

  it('returns null when no passkey-specific translation exists', () => {
    expect(translatePasskeyError(new Error('x'), t, label)).toBeNull();
  });

  it('returns null when code is not a string', () => {
    expect(
      translatePasskeyError(
        {
          code: 42,
          data: {
            cause: {
              code: 99,
            },
          },
        },
        t,
        label,
      ),
    ).toBeNull();
  });

  it('returns null when string code is unknown', () => {
    expect(
      translatePasskeyError({ code: 'UnknownPasskeyCode' }, t, label),
    ).toBeNull();
  });

  it('prefers root string code over data.cause.code', () => {
    expect(
      translatePasskeyError(
        {
          code: PasskeyControllerErrorCode.NoAuthenticationCeremony,
          data: {
            cause: {
              code: PasskeyControllerErrorCode.VaultKeyMismatch,
            },
          },
        },
        t,
        label,
      ),
    ).toBe('t:passkeyErrorNoAuthenticationCeremony(Biometrics)');
  });

  it('supports the usual UI fallback with nullish coalescing', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.NoAuthenticationCeremony },
        t,
        label,
      ) ?? t('passkeyUnlockFailed', [label]),
    ).toBe('t:passkeyErrorNoAuthenticationCeremony(Biometrics)');
    expect(
      translatePasskeyError(new Error('x'), t, label) ??
        t('passkeyUnlockFailed', [label]),
    ).toBe('t:passkeyUnlockFailed(Biometrics)');
  });

  it('maps extension vault key renewal failed code', () => {
    expect(
      translatePasskeyError(
        { code: ExtensionPasskeyErrorCode.VaultKeyRenewalFailed },
        t,
        label,
      ),
    ).toBe('t:passkeyErrorVaultKeyRenewalFailed(Biometrics)');
  });

  it('forwards a Windows Hello label as substitution', () => {
    expect(
      translatePasskeyError(
        { code: PasskeyControllerErrorCode.AlreadyEnrolled },
        t,
        'Windows Hello',
      ),
    ).toBe('t:passkeyErrorAlreadyEnrolled(Windows Hello)');
  });
});

describe('getPasskeyControllerErrorCode', () => {
  it('reads root string code for extension vault key renewal', () => {
    expect(
      getPasskeyControllerErrorCode({
        code: ExtensionPasskeyErrorCode.VaultKeyRenewalFailed,
      }),
    ).toBe(ExtensionPasskeyErrorCode.VaultKeyRenewalFailed);
  });

  it('reads MetaRPC-style data.cause.code for extension vault key renewal', () => {
    const err = new JsonRpcError(-32603, 'internal error', {
      cause: {
        name: 'PasskeyControllerError',
        code: ExtensionPasskeyErrorCode.VaultKeyRenewalFailed,
      },
    });
    expect(getPasskeyControllerErrorCode(err)).toBe(
      ExtensionPasskeyErrorCode.VaultKeyRenewalFailed,
    );
  });

  it('prefers root string code over data.cause.code', () => {
    expect(
      getPasskeyControllerErrorCode({
        code: PasskeyControllerErrorCode.NotEnrolled,
        data: {
          cause: {
            code: ExtensionPasskeyErrorCode.VaultKeyRenewalFailed,
          },
        },
      }),
    ).toBe(PasskeyControllerErrorCode.NotEnrolled);
  });

  it('returns null for non-objects', () => {
    expect(getPasskeyControllerErrorCode(null)).toBeNull();
    expect(getPasskeyControllerErrorCode('x')).toBeNull();
  });
});

describe('getPasskeyErrorCode', () => {
  it('returns timeout for PasskeyCeremonyTimeoutError', () => {
    expect(getPasskeyErrorCode(new PasskeyCeremonyTimeoutError())).toBe(
      'timeout',
    );
  });

  it('returns not_allowed for NotAllowedError', () => {
    const notAllowed = new Error('x');
    notAllowed.name = 'NotAllowedError';
    expect(getPasskeyErrorCode(notAllowed)).toBe('not_allowed');
  });

  it('returns aborted for AbortError', () => {
    const abort = new Error('x');
    abort.name = 'AbortError';
    expect(getPasskeyErrorCode(abort)).toBe('aborted');
  });

  it('returns controller code when present', () => {
    expect(
      getPasskeyErrorCode({
        code: PasskeyControllerErrorCode.NotEnrolled,
      }),
    ).toBe(PasskeyControllerErrorCode.NotEnrolled);
    expect(
      getPasskeyErrorCode({
        code: PasskeyControllerErrorCode.AuthenticationVerificationFailed,
      }),
    ).toBe(PasskeyControllerErrorCode.AuthenticationVerificationFailed);
    expect(
      getPasskeyErrorCode({
        code: PasskeyControllerErrorCode.VaultKeyMismatch,
      }),
    ).toBe(PasskeyControllerErrorCode.VaultKeyMismatch);
  });

  it('returns unknown when no client outcome and no controller code', () => {
    expect(getPasskeyErrorCode(new Error('x'))).toBe('unknown');
    expect(getPasskeyErrorCode(null)).toBe('unknown');
  });
});
