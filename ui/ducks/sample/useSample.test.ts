import { act } from '@testing-library/react-hooks';
import { useSample } from './useSample';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';

describe('sample hooks', () => {
  describe('useCounter hook', () => {
    it('should return the counter value', () => {
      const { result } = renderHookWithProvider(useSample, {
        sample: { counter: 5, error: null },
      });

      expect(result.current.value).toBe(5);
    });

    it('should return error', () => {
      const { result } = renderHookWithProvider(useSample, {
        sample: { counter: 0, error: 'test error' },
      });

      expect(result.current.error).toBe('test error');
    });

    it('should increment counter when increment is called', () => {
      const { result } = renderHookWithProvider(useSample, {
        sample: { counter: 0, error: null },
      });

      act(() => {
        result.current.increment();
      });

      // Check if the value updated in the hook's return value
      expect(result.current.value).toBe(1);
    });

    it('should set counter when setCounter is called with valid value', () => {
      const { result } = renderHookWithProvider(useSample, {
        sample: { counter: 0, error: null },
      });

      act(() => {
        result.current.setCounter(10);
      });

      // Check if the value updated in the hook's return value
      expect(result.current.value).toBe(10);
    });

    it('should set error when setCounter is called with negative value', () => {
      const { result } = renderHookWithProvider(useSample, {
        sample: { counter: 0, error: null },
      });

      act(() => {
        result.current.setCounter(-5);
      });

      // Check the error in the hook's return value
      expect(result.current.error).toBe('Counter cannot be negative.');
      // Counter should remain unchanged
      expect(result.current.value).toBe(0);
    });
  });
});
