import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  REFERRAL_CODE_DEBOUNCE_MS,
  useValidateReferralCode,
} from './useValidateReferralCode';

jest.useFakeTimers();

jest.mock('../../store/actions', () => ({
  validateRewardsReferralCode: jest.fn(() => async () => true),
}));

const { validateRewardsReferralCode } = jest.requireMock(
  '../../store/actions',
) as { validateRewardsReferralCode: jest.Mock };

describe('useValidateReferralCode', () => {
  const advanceReferralCodeDebounce = async (
    ms = REFERRAL_CODE_DEBOUNCE_MS,
  ) => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  };

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

  it('does not validate for empty input', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode(),
      {},
    );

    act(() => {
      result.current.setReferralCode('   ');
    });

    expect(result.current.isValidating).toBe(false);
    expect(result.current.isValid).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(validateRewardsReferralCode).not.toHaveBeenCalled();
  });

  it('does not validate locally invalid referral code formats', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode(),
      {},
    );

    act(() => {
      result.current.setReferralCode('ab');
    });

    expect(result.current.referralCode).toBe('AB');
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isValid).toBe(false);

    await advanceReferralCodeDebounce();

    act(() => {
      result.current.setReferralCode('abcdefghijklm');
    });

    expect(result.current.referralCode).toBe('ABCDEFGHIJKLM');
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isValid).toBe(false);

    await advanceReferralCodeDebounce();

    act(() => {
      result.current.setReferralCode('abc_123');
    });

    expect(result.current.referralCode).toBe('ABC_123');
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isValid).toBe(false);

    await advanceReferralCodeDebounce();

    expect(validateRewardsReferralCode).not.toHaveBeenCalled();
  });

  it('does not call validateCode backend for locally invalid referral code formats', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode(),
      {},
    );

    const tooShortError = await result.current.validateCode('ab');
    expect(tooShortError).toBe('Invalid code');

    const badCharacterError = await result.current.validateCode('abc_123');
    expect(badCharacterError).toBe('Invalid code');

    expect(validateRewardsReferralCode).not.toHaveBeenCalled();
  });

  it('validates after debounce for any locally valid input and sets isValid=true', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('abc');
    });

    expect(result.current.isValidating).toBe(true);

    await advanceReferralCodeDebounce(1000);

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
    const calls = validateRewardsReferralCode.mock.calls.map((c) => c[0]);
    expect(calls).toContain('ABC');
  });

  it('validates vanity codes longer than 6 chars', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('bankless');
    });

    expect(result.current.isValidating).toBe(true);

    await advanceReferralCodeDebounce(1000);

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(true);
    const calls = validateRewardsReferralCode.mock.calls.map((c) => c[0]);
    expect(calls).toContain('BANKLESS');
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

    await advanceReferralCodeDebounce(1000);

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

    await advanceReferralCodeDebounce(1000);

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

    await advanceReferralCodeDebounce(1000);

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.isUnknownError).toBe(true);
  });

  it('validateCode returns messages without setting the referral code', async () => {
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
    expect(result.current.referralCode).toBe('');
  });

  it('initialValue triggers validation and respects debounce', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('abc123', 500),
      {},
    );

    // After mount, initialValue is set and validation starts
    expect(result.current.isValidating).toBe(true);

    await advanceReferralCodeDebounce(500);

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });
    expect(result.current.isValid).toBe(true);
    const calls = validateRewardsReferralCode.mock.calls.map((c) => c[0]);
    expect(calls).toContain('ABC123');
  });

  it('debounces rapid input changes and only validates the last value', async () => {
    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('a');
      result.current.setReferralCode('ab');
      result.current.setReferralCode('abc');
    });

    expect(result.current.referralCode).toBe('ABC');
    expect(result.current.isValidating).toBe(true);
    expect(validateRewardsReferralCode).not.toHaveBeenCalled();

    await advanceReferralCodeDebounce(1000);

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(validateRewardsReferralCode).toHaveBeenCalledTimes(1);
    expect(validateRewardsReferralCode).toHaveBeenCalledWith('ABC');
    expect(result.current.isValid).toBe(true);
  });

  it('discards stale responses when a newer validation has completed', async () => {
    let resolveFirst: (value: boolean) => void;
    const firstPromise = new Promise<boolean>((resolve) => {
      resolveFirst = resolve;
    });

    validateRewardsReferralCode
      .mockReturnValueOnce(async () => firstPromise)
      .mockReturnValueOnce(async () => true);

    const { result } = renderHookWithProvider(
      () => useValidateReferralCode('', 1000),
      {},
    );

    act(() => {
      result.current.setReferralCode('abcdef');
    });

    await advanceReferralCodeDebounce(1000);

    act(() => {
      result.current.setReferralCode('ghjkmn');
    });

    await advanceReferralCodeDebounce(1000);

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });

    await act(async () => {
      resolveFirst?.(false);
    });

    expect(result.current.referralCode).toBe('GHJKMN');
    expect(result.current.isValid).toBe(true);
  });
});
