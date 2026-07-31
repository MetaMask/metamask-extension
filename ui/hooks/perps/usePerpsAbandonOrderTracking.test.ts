import { act, renderHook } from '@testing-library/react-hooks';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { usePerpsAbandonOrderTracking } from './usePerpsAbandonOrderTracking';

const mockTrack = jest.fn();
jest.mock('./usePerpsEventTracking', () => ({
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

describe('usePerpsAbandonOrderTracking', () => {
  const abandonProps = { asset: 'ETH', action: 'abandon_order' };
  const renderTracking = (
    hasCommittedRef: { current: boolean },
    active = true,
  ) =>
    renderHook(
      ({ isActive }: { isActive: boolean }) =>
        usePerpsAbandonOrderTracking({
          getAbandonProperties: () => abandonProps,
          hasCommittedRef,
          active: isActive,
        }),
      { initialProps: { isActive: active } },
    );

  // The emit is deferred one macrotask so a StrictMode setup/cleanup/setup probe
  // can cancel it; tests drive that clock explicitly.
  const flushDeferredEmit = () => {
    act(() => {
      jest.advanceTimersByTime(0);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('emits abandon_order with time on screen when the surface unmounts', () => {
    const { unmount } = renderTracking({ current: false });

    expect(mockTrack).not.toHaveBeenCalled();
    unmount();
    flushDeferredEmit();

    expect(mockTrack).toHaveBeenCalledTimes(1);
    const [eventName, properties] = mockTrack.mock.calls[0];
    expect(eventName).toBe(MetaMetricsEventName.PerpsUiInteraction);
    expect(properties).toEqual(
      expect.objectContaining({ asset: 'ETH', action: 'abandon_order' }),
    );
    expect(properties.time_on_screen_ms).toBeGreaterThanOrEqual(0);
  });

  it('does not emit once the caller marked the flow committed', () => {
    const hasCommittedRef = { current: false };
    const { unmount } = renderTracking(hasCommittedRef);

    hasCommittedRef.current = true;
    unmount();
    flushDeferredEmit();

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('emits when a still-mounted surface goes inactive', () => {
    const { rerender } = renderTracking({ current: false });

    rerender({ isActive: false });
    flushDeferredEmit();

    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('emits once when pagehide fires before teardown', () => {
    const { unmount } = renderTracking({ current: false });

    window.dispatchEvent(new Event('pagehide'));
    unmount();
    flushDeferredEmit();

    // The one-shot guard keeps the popup-dismissal and unmount paths from
    // double-reporting the same abandonment.
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('does not emit while the surface was never active', () => {
    const { unmount } = renderTracking({ current: false }, false);

    unmount();
    flushDeferredEmit();

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('does not emit for a StrictMode setup/cleanup/setup probe', () => {
    const hasCommittedRef = { current: false };
    // StrictMode tears the effect down and sets it up again on the same
    // instance, so the commit ref identity is preserved. That teardown is not
    // the user leaving and must not report an abandonment.
    const first = renderTracking(hasCommittedRef);
    first.unmount();
    const second = renderTracking(hasCommittedRef);
    flushDeferredEmit();

    expect(mockTrack).not.toHaveBeenCalled();

    // The real exit still reports.
    second.unmount();
    flushDeferredEmit();
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });
});
