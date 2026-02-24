import { CriticalErrorType } from '../../../../shared/constants/state-corruption';
import { normalizeCriticalErrorType } from './critical-error-params';

describe('normalizeCriticalErrorType', () => {
  it.each([
    [CriticalErrorType.BackgroundConnectionTimeout],
    [CriticalErrorType.BackgroundInitTimeout],
    [CriticalErrorType.BackgroundStateSyncTimeout],
    [CriticalErrorType.Other],
  ])('returns value when it is a valid CriticalErrorType', (value) => {
    expect(normalizeCriticalErrorType(value)).toBe(value);
  });

  it('returns Other when value is undefined', () => {
    expect(normalizeCriticalErrorType(undefined)).toBe(CriticalErrorType.Other);
  });

  it('returns Other when value is null', () => {
    expect(normalizeCriticalErrorType(null)).toBe(CriticalErrorType.Other);
  });

  it('returns Other when value is not a string', () => {
    expect(normalizeCriticalErrorType(123)).toBe(CriticalErrorType.Other);
    expect(normalizeCriticalErrorType({})).toBe(CriticalErrorType.Other);
  });

  it('returns Other when value is an unknown string', () => {
    expect(normalizeCriticalErrorType('unknown_type')).toBe(
      CriticalErrorType.Other,
    );
  });
});
