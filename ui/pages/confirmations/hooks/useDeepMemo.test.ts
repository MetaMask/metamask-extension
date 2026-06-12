import { renderHook } from '@testing-library/react-hooks';
import { useDeepMemo } from './useDeepMemo';

const RESULT_MOCK = { a: 1 };
const RESULT_2_MOCK = { a: 2 };

describe('useDeepMemo', () => {
  const factoryMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    factoryMock
      .mockReturnValueOnce(RESULT_MOCK)
      .mockReturnValueOnce(RESULT_2_MOCK);
  });

  it('returns same factory result if deep equality', () => {
    const { result, rerender } = renderHook(
      ({ factory, deps }) => useDeepMemo(factory, deps),
      { initialProps: { factory: factoryMock, deps: [{ b: 1 }] } },
    );

    rerender({ factory: factoryMock, deps: [{ b: 1 }] });

    expect(factoryMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(RESULT_MOCK);
  });

  it('returns new factory result if not deep equality', () => {
    const { result, rerender } = renderHook(
      ({ factory, deps }) => useDeepMemo(factory, deps),
      { initialProps: { factory: factoryMock, deps: [{ b: 1 }] } },
    );

    rerender({ factory: factoryMock, deps: [{ b: 2 }] });

    expect(factoryMock).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(RESULT_2_MOCK);
  });

  it('returns same factory result if primitive dependencies not changed', () => {
    const { result, rerender } = renderHook(
      ({ factory, deps }) => useDeepMemo(factory, deps),
      { initialProps: { factory: factoryMock, deps: [true, 'test', 1] } },
    );

    rerender({ factory: factoryMock, deps: [true, 'test', 1] });

    expect(factoryMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(RESULT_MOCK);
  });

  it('returns new factory result if primitive dependencies changed', () => {
    const { result, rerender } = renderHook(
      ({ factory, deps }) => useDeepMemo(factory, deps),
      { initialProps: { factory: factoryMock, deps: [true, 'test', 1] } },
    );

    rerender({ factory: factoryMock, deps: [true, 'test', 2] });

    expect(factoryMock).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(RESULT_2_MOCK);
  });

  it('returns same factory result if no dependencies', () => {
    const { result, rerender } = renderHook(
      ({ factory, deps }) => useDeepMemo(factory, deps),
      { initialProps: { factory: factoryMock, deps: [] } },
    );

    rerender({ factory: factoryMock, deps: [] });

    expect(factoryMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(RESULT_MOCK);
  });
});
