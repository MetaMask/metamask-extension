import { renderHook } from '@testing-library/react';

import { endTrace, trace, TraceName } from '../../shared/lib/trace';
import { useTrace } from './useTrace';

jest.mock('../../shared/lib/trace', () => ({
  endTrace: jest.fn(),
  trace: jest.fn(),
  TraceName: { HomepageBalanceReady: 'Homepage Balance Ready' },
}));

describe('useTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts and ends a trace when it becomes ready', () => {
    const { rerender } = renderHook(
      ({ ready }) =>
        useTrace({
          name: TraceName.HomepageBalanceReady,
          op: 'test.operation',
          generationKey: 'first',
          ready,
          data: { success: true },
        }),
      { initialProps: { ready: false } },
    );

    expect(trace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.HomepageBalanceReady,
        op: 'test.operation',
      }),
    );
    expect(endTrace).not.toHaveBeenCalled();

    rerender({ ready: true });

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.HomepageBalanceReady,
        data: { success: true },
      }),
    );
  });

  it('ends an unfinished trace on unmount', () => {
    const { unmount } = renderHook(() =>
      useTrace({ name: TraceName.HomepageBalanceReady }),
    );

    unmount();

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.HomepageBalanceReady,
        data: { success: false, reason: 'unmounted' },
      }),
    );
  });

  it('starts a new trace when the generation changes', () => {
    const { rerender } = renderHook(
      ({ generationKey }) =>
        useTrace({ name: TraceName.HomepageBalanceReady, generationKey }),
      { initialProps: { generationKey: 'first' } },
    );

    rerender({ generationKey: 'second' });

    expect(trace).toHaveBeenCalledTimes(2);
    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { success: false, reason: 'superseded' },
      }),
    );
  });
});
