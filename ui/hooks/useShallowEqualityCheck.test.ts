import { renderHook } from '@testing-library/react-hooks';
import { useShallowEqualityCheck } from './useShallowEqualityCheck';

describe('useShallowEqualityCheck', () => {
  it('returns same reference when values are shallowly equal', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useShallowEqualityCheck(value),
      { initialProps: { value: { a: 1, b: 2 } } },
    );

    const firstResult = result.current;

    // Rerender with a new object reference but same values
    rerender({ value: { a: 1, b: 2 } });

    expect(result.current).toBe(firstResult);
  });

  it('returns new reference when values change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useShallowEqualityCheck(value),
      { initialProps: { value: { a: 1, b: 2 } } },
    );

    const firstResult = result.current;

    // Rerender with different values
    rerender({ value: { a: 1, b: 3 } });

    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual({ a: 1, b: 3 });
  });

  it('correctly distinguishes objects with comma-containing string values', () => {
    // This test verifies the fix for the memoization collision bug
    const { result, rerender } = renderHook(
      ({ value }) => useShallowEqualityCheck(value),
      { initialProps: { value: { a: 'x,y', b: 'z' } } },
    );

    const firstResult = result.current;

    // These would collide with comma-join: both produce 'x,y,z'
    rerender({ value: { a: 'x', b: 'y,z' } });

    // Should be different references (not a collision)
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual({ a: 'x', b: 'y,z' });
  });

  it('correctly distinguishes undefined values from missing keys', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useShallowEqualityCheck(value),
      { initialProps: { value: { a: 'x', b: undefined } as Record<string, string | undefined> } },
    );

    const firstResult = result.current;

    // Object without 'b' key (different from { b: undefined })
    rerender({ value: { a: 'x' } });

    // Should be different references
    expect(result.current).not.toBe(firstResult);
  });

  it('handles primitive values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useShallowEqualityCheck(value),
      { initialProps: { value: 'test' } },
    );

    const firstResult = result.current;

    rerender({ value: 'test' });
    expect(result.current).toBe(firstResult);

    rerender({ value: 'changed' });
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toBe('changed');
  });

  it('handles arrays with shallow comparison', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useShallowEqualityCheck(value),
      { initialProps: { value: [1, 2, 3] } },
    );

    const firstResult = result.current;

    // Same values, new reference
    rerender({ value: [1, 2, 3] });
    expect(result.current).toBe(firstResult);

    // Different values
    rerender({ value: [1, 2, 4] });
    expect(result.current).not.toBe(firstResult);
  });
});
