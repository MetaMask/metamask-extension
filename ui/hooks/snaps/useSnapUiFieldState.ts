import { Dispatch, SetStateAction, useState } from 'react';

/**
 * Local Snap UI field state that follows an external `getValue` result.
 *
 * When the external value changes to a defined value, local state is updated
 * during render. `null` / `undefined` is recorded but does not clear local
 * state, so a later restore of the same value still applies.
 *
 * @param externalValue - The current Snap interface value for the field.
 * @param fallback - Used when the external value is unset on first render.
 * @returns The local value and setter, same shape as `useState`.
 */
export function useSnapUiFieldState<Value>(
  externalValue: Value | null | undefined,
  fallback: Value,
): [Value, Dispatch<SetStateAction<Value>>] {
  const [value, setValue] = useState(externalValue ?? fallback);
  const [prevExternalValue, setPrevExternalValue] = useState(externalValue);

  if (externalValue !== prevExternalValue) {
    setPrevExternalValue(externalValue);
    if (externalValue !== undefined && externalValue !== null) {
      setValue(externalValue);
    }
  }

  return [value, setValue];
}
