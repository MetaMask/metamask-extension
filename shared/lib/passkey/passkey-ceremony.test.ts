import {
  PasskeyCeremonyTimeoutError,
  isPasskeyCeremonySilentError,
} from './passkey-ceremony';

describe('isPasskeyCeremonySilentError', () => {
  it('returns true for PasskeyCeremonyTimeoutError', () => {
    expect(
      isPasskeyCeremonySilentError(new PasskeyCeremonyTimeoutError()),
    ).toBe(true);
  });

  it('returns true for DOMException NotAllowedError', () => {
    expect(
      isPasskeyCeremonySilentError(
        new DOMException('cancelled', 'NotAllowedError'),
      ),
    ).toBe(true);
  });

  it('returns true for Error named AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(isPasskeyCeremonySilentError(err)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isPasskeyCeremonySilentError(new Error('network'))).toBe(false);
    expect(isPasskeyCeremonySilentError(null)).toBe(false);
    expect(isPasskeyCeremonySilentError(undefined)).toBe(false);
  });
});
