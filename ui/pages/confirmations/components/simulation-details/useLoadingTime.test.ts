import { renderHook, act } from '@testing-library/react-hooks';
import { useLoadingTime } from './useLoadingTime';

describe('useLoadingTime', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should return the loading time when setLoadingComplete is called', () => {
    const { result } = renderHook(() => useLoadingTime());

    expect(result.current.loadingTime).toBeUndefined();

    act(() => {
      jest.advanceTimersByTime(2000);
      result.current.setLoadingComplete();
    });

    expect(result.current.loadingTime).toBeCloseTo(2);
  });

  it('should not update the loading time if setLoadingComplete is called multiple times', () => {
    const { result } = renderHook(() => useLoadingTime());

    act(() => {
      jest.advanceTimersByTime(1000);
      result.current.setLoadingComplete();
    });

    expect(result.current.loadingTime).toBeCloseTo(1);

    act(() => {
      jest.advanceTimersByTime(1000);
      result.current.setLoadingComplete();
    });

    expect(result.current.loadingTime).toBeCloseTo(1);
  });
});
