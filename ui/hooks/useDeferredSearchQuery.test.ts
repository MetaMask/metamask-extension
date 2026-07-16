import { act, renderHook } from '@testing-library/react-hooks';
import { useDeferredSearchQuery } from './useDeferredSearchQuery';

jest.mock('./useDeferredValue', () => ({
  useDeferredValue: jest.fn((value: string) => value),
}));

const mockUseDeferredValue = jest.mocked(
  jest.requireMock('./useDeferredValue').useDeferredValue,
);

describe('useDeferredSearchQuery', () => {
  beforeEach(() => {
    mockUseDeferredValue.mockImplementation((value: string) => value);
  });

  it('returns the initial query synchronously on first render', () => {
    const { result } = renderHook(() => useDeferredSearchQuery('alpha'));

    expect(result.current.query).toBe('alpha');
    expect(result.current.deferredQuery).toBe('alpha');
    expect(result.current.isPending).toBe(false);
  });

  it('updates query immediately', () => {
    const { result } = renderHook(() => useDeferredSearchQuery(''));

    act(() => {
      result.current.setQuery('beta');
    });

    expect(result.current.query).toBe('beta');
  });

  it('marks pending when deferred query lags behind the latest input', () => {
    mockUseDeferredValue.mockReturnValue('stale');

    const { result } = renderHook(() => useDeferredSearchQuery('live'));

    expect(result.current.isPending).toBe(true);
    expect(result.current.deferredQuery).toBe('stale');
  });
});
