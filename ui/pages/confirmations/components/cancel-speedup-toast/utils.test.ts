import { resolveCancelSpeedupErrorMessage } from './utils';

describe('resolveCancelSpeedupErrorMessage', () => {
  it('returns cancelSpeedupAlreadyConfirmedDescription for "already confirmed" errors', () => {
    expect(
      resolveCancelSpeedupErrorMessage(
        'Previous transaction is already confirmed',
      ),
    ).toBe('cancelSpeedupAlreadyConfirmedDescription');
  });

  it('returns cancelSpeedupAlreadyConfirmedDescription when the substring appears in a longer message', () => {
    expect(
      resolveCancelSpeedupErrorMessage(
        'Error: Previous transaction is already confirmed on the network',
      ),
    ).toBe('cancelSpeedupAlreadyConfirmedDescription');
  });

  it('returns cancelSpeedupFailedDescription for unknown errors', () => {
    expect(resolveCancelSpeedupErrorMessage('gas estimation failed')).toBe(
      'cancelSpeedupFailedDescription',
    );
  });

  it('returns cancelSpeedupFailedDescription for empty string', () => {
    expect(resolveCancelSpeedupErrorMessage('')).toBe(
      'cancelSpeedupFailedDescription',
    );
  });

  it('returns cancelSpeedupFailedDescription when errorMessage is undefined', () => {
    expect(resolveCancelSpeedupErrorMessage(undefined)).toBe(
      'cancelSpeedupFailedDescription',
    );
  });

  it('returns cancelSpeedupFailedDescription when errorMessage is null', () => {
    expect(resolveCancelSpeedupErrorMessage(null)).toBe(
      'cancelSpeedupFailedDescription',
    );
  });
});
