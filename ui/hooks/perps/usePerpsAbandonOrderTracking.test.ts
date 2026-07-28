import { renderHook } from '@testing-library/react-hooks';
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits abandon_order with time on screen when the surface unmounts', () => {
    const { unmount } = renderTracking({ current: false });

    expect(mockTrack).not.toHaveBeenCalled();
    unmount();

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

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('emits when a still-mounted surface goes inactive', () => {
    const { rerender } = renderTracking({ current: false });

    rerender({ isActive: false });

    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('emits once when pagehide fires before teardown', () => {
    const { unmount } = renderTracking({ current: false });

    window.dispatchEvent(new Event('pagehide'));
    unmount();

    // The one-shot guard keeps the popup-dismissal and unmount paths from
    // double-reporting the same abandonment.
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('does not emit while the surface was never active', () => {
    const { unmount } = renderTracking({ current: false }, false);

    unmount();

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
