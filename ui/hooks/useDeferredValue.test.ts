import { renderHook } from '@testing-library/react-hooks';
import { useDeferredValue } from './useDeferredValue';

describe('useDeferredValue', () => {
  it('re-exports React.useDeferredValue', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDeferredValue(value),
      { initialProps: { value: 'alpha' } },
    );

    expect(result.current).toBe('alpha');

    rerender({ value: 'beta' });

    expect(result.current).toBeDefined();
  });
});
