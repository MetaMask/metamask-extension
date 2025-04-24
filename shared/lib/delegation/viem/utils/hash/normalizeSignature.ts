import { BaseError } from '../../errors/base';
import type { ErrorType } from '../../errors/utils';

type NormalizeSignatureParameters = string;
type NormalizeSignatureReturnType = string;
export type NormalizeSignatureErrorType = ErrorType;

export function normalizeSignature(
  signature: NormalizeSignatureParameters,
): NormalizeSignatureReturnType {
  let active = true;
  let current = '';
  let level = 0;
  let result = '';
  let valid = false;

  for (let i = 0; i < signature.length; i++) {
    const char = signature[i];

    // If the character is a separator, we want to reactivate.
    if (['(', ')', ','].includes(char)) {
      active = true;
    }

    // If the character is a "level" token, we want to increment/decrement.
    if (char === '(') {
      level += 1;
    }
    if (char === ')') {
      level -= 1;
    }

    // If we aren't active, we don't want to mutate the result.
    if (!active) {
      continue;
    }

    // If level === 0, we are at the definition level.
    if (level === 0) {
      if (char === ' ' && ['event', 'function', ''].includes(result)) {
        result = '';
      } else {
        result += char;

        // If we are at the end of the definition, we must be finished.
        if (char === ')') {
          valid = true;
          break;
        }
      }

      continue;
    }

    // Ignore spaces
    if (char === ' ') {
      // If the previous character is a separator, and the current section isn't empty, we want to deactivate.
      if (signature[i - 1] !== ',' && current !== ',' && current !== ',(') {
        current = '';
        active = false;
      }
      continue;
    }

    result += char;
    current += char;
  }

  if (!valid) {
    throw new BaseError('Unable to normalize signature.');
  }

  return result;
}
