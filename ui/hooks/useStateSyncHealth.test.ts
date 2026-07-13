import { act, renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { forceUpdateMetamaskState } from '../store/actions';
import { useStateSyncHealth } from './useStateSyncHealth';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  forceUpdateMetamaskState: jest.fn(),
}));

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockForceUpdateMetamaskState =
  forceUpdateMetamaskState as jest.MockedFunction<
    typeof forceUpdateMetamaskState
  >;

describe('useStateSyncHealth', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch = jest.fn().mockResolvedValue(undefined);
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockForceUpdateMetamaskState.mockResolvedValue(undefined as never);
    jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally suppressed in tests
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('does not start a check interval when not syncing', () => {
    renderHook(() => useStateSyncHealth(false));

    act(() => {
      jest.advanceTimersByTime(70_000);
    });

    expect(mockForceUpdateMetamaskState).not.toHaveBeenCalled();
  });

  it('does not trigger recovery before the stale threshold', () => {
    renderHook(() => useStateSyncHealth(true));

    act(() => {
      jest.advanceTimersByTime(50_000); // under the 60 s threshold
    });

    expect(mockForceUpdateMetamaskState).not.toHaveBeenCalled();
  });

  it('triggers recovery after the stale threshold', async () => {
    renderHook(() => useStateSyncHealth(true));

    await act(async () => {
      jest.advanceTimersByTime(70_000); // past the 60 s threshold
      // flush microtask queue so the async checkStale resolves
      await Promise.resolve();
    });

    expect(mockForceUpdateMetamaskState).toHaveBeenCalledWith(mockDispatch);
    expect(console.warn).toHaveBeenCalledWith(
      'Stale state sync detected, triggering recovery',
      expect.objectContaining({ elapsed: expect.any(Number) }),
    );
  });

  it('clears the interval when syncing stops', () => {
    const { rerender } = renderHook(
      ({ isSyncing }: { isSyncing: boolean }) =>
        useStateSyncHealth(isSyncing),
      { initialProps: { isSyncing: true } },
    );

    // Stop syncing before the threshold
    rerender({ isSyncing: false });

    act(() => {
      jest.advanceTimersByTime(70_000);
    });

    expect(mockForceUpdateMetamaskState).not.toHaveBeenCalled();
  });

  it('does not trigger concurrent recovery calls', async () => {
    // Make forceUpdateMetamaskState hang so a second interval tick can overlap
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolveRecovery: () => void = () => {};
    mockForceUpdateMetamaskState.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveRecovery = resolve;
        }),
    );

    renderHook(() => useStateSyncHealth(true));

    // Advance to just past threshold (first tick that triggers recovery)
    await act(async () => {
      jest.advanceTimersByTime(70_000);
      await Promise.resolve();
    });

    // First recovery call is in progress; advance another interval tick
    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
    });

    // Should still only be called once (second tick skipped due to guard)
    expect(mockForceUpdateMetamaskState).toHaveBeenCalledTimes(1);

    // Resolve the pending recovery
    await act(async () => {
      resolveRecovery();
      await Promise.resolve();
    });
  });

  it('resets the start time when syncing resumes after recovery', async () => {
    const { rerender } = renderHook(
      ({ isSyncing }: { isSyncing: boolean }) =>
        useStateSyncHealth(isSyncing),
      { initialProps: { isSyncing: true } },
    );

    // First recovery cycle
    await act(async () => {
      jest.advanceTimersByTime(70_000);
      await Promise.resolve();
    });

    expect(mockForceUpdateMetamaskState).toHaveBeenCalledTimes(1);

    // Simulate sync restarting
    rerender({ isSyncing: false });
    rerender({ isSyncing: true });

    // Should not recover again within the threshold
    act(() => {
      jest.advanceTimersByTime(50_000);
    });

    expect(mockForceUpdateMetamaskState).toHaveBeenCalledTimes(1);
  });
});
