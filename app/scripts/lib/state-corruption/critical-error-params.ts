import { CriticalErrorType } from '../../../../shared/constants/state-corruption';

const VALID_CRITICAL_ERROR_TYPES = new Set(
  Object.values(CriticalErrorType) as string[],
);

/**
 * Normalizes a value from a message param to a CriticalErrorType.
 * Returns CriticalErrorType.Other if the value is missing or invalid.
 *
 * @param value - Raw value from message params (e.g. from UI).
 * @returns A valid CriticalErrorType.
 */
export function normalizeCriticalErrorType(value: unknown): CriticalErrorType {
  if (typeof value === 'string' && VALID_CRITICAL_ERROR_TYPES.has(value)) {
    return value as CriticalErrorType;
  }
  return CriticalErrorType.Other;
}
