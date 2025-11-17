import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { useValidateReferralCode } from './useValidateReferralCode';

jest.useFakeTimers();

jest.mock('../../store/actions', () => ({
  validateRewardsReferralCode: jest.fn(() => async () => true),
}));

const { validateRewardsReferralCode } = jest.requireMock(
  '../../store/actions',
) as { validateRewardsReferralCode: jest.Mock };

describe('useValidateReferralCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(0);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns initial state for empty initialValue', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode(),
      {},
    );

    expect(result.current.referralCode).toBe('');
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.isUnknownError).toBe(false);
    expect(validateRewardsReferralCode).not.toHaveBeenCalled();
  });

  it('does not validate while code length is less than 6', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode(),
      {},
    );

    act(() => {
      result.current.setReferralCode('abc');
    });

    expect(result.current.isValidating).toBe(false);
    expect(result.current.isValid).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(validateRewardsReferralCode).not.toHaveBeenCalled();
  });

  it('validates successfully when code length is >= 6 and sets isValid=true', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('abc123');
    });

    expect(result.current.isValidating).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
    // Uppercases and trims input before dispatching
    const calls = validateRewardsReferralCode.mock.calls.map((c) => c[0]);
    expect(calls).toContain('ABC123');
  });

  it('sets isValid=false when validation returns false', async () => {
    validateRewardsReferralCode.mockReturnValueOnce(async () => false);

    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('abcdef');
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
  });

  it('sets isUnknownError=true when validation throws', async () => {
    validateRewardsReferralCode.mockImplementationOnce(() => async () => {
      throw new Error('boom');
    });

    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('abcdef');
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.isUnknownError).toBe(true);
  });

  it('validateCode returns messages and toggles unknown error on thrown error', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode(),
      {},
    );

    // Success
    let msg = await result.current.validateCode('abcdef');
    expect(msg).toBe('');

    // Invalid
    validateRewardsReferralCode.mockReturnValueOnce(async () => false);
    msg = await result.current.validateCode('abcdef');
    expect(msg).toBe('Invalid code');

    // Unknown error
    validateRewardsReferralCode.mockImplementationOnce(() => async () => {
      throw new Error('boom');
    });
    msg = await result.current.validateCode('abcdef');
    expect(msg).toBe('Unknown error');
    expect(result.current.isUnknownError).toBe(true);
  });

  it('initialValue triggers validation and respects debounce', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('abc123', 500),
      {},
    );

    // After mount, initialValue is set and validation starts
    expect(result.current.isValidating).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });
    expect(result.current.isValid).toBe(true);
    const calls = validateRewardsReferralCode.mock.calls.map((c) => c[0]);
    expect(calls).toContain('ABC123');
  });
});
