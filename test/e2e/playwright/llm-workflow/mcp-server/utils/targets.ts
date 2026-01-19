import type { TargetSelection } from '../types';

export type TargetValidationResult =
  | { valid: true; type: 'a11yRef' | 'testId' | 'selector'; value: string }
  | { valid: false; error: string };

export function validateTargetSelection(
  target: TargetSelection,
): TargetValidationResult {
  const provided = [
    target.a11yRef ? 'a11yRef' : null,
    target.testId ? 'testId' : null,
    target.selector ? 'selector' : null,
  ].filter(Boolean) as ('a11yRef' | 'testId' | 'selector')[];

  if (provided.length === 0) {
    return {
      valid: false,
      error: 'Exactly one of a11yRef, testId, or selector must be provided',
    };
  }

  if (provided.length > 1) {
    return {
      valid: false,
      error: `Multiple targets provided (${provided.join(', ')}). Exactly one must be specified.`,
    };
  }

  const type = provided[0];
  const value = target[type] as string;

  return { valid: true, type, value };
}
