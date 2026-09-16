import { renderHook } from '@testing-library/react';
import { useTrackOnce } from './useTrackOnce';

describe('useTrackOnce', () => {
  it('does not track while not ready', () => {
    const track = jest.fn();

    renderHook(() => useTrackOnce(false, track));

    expect(track).not.toHaveBeenCalled();
  });

  it('tracks once when it becomes ready and never again', () => {
    const track = jest.fn();
    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) => useTrackOnce(isReady, track),
      { initialProps: { isReady: false } },
    );

    rerender({ isReady: true });
    rerender({ isReady: false });
    rerender({ isReady: true });

    expect(track).toHaveBeenCalledTimes(1);
  });

  it('tracks on mount when already ready', () => {
    const track = jest.fn();

    const { rerender } = renderHook(() => useTrackOnce(true, track));
    rerender();

    expect(track).toHaveBeenCalledTimes(1);
  });
});
