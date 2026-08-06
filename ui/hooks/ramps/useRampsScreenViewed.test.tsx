import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { useRampsScreenViewed } from './useRampsScreenViewed';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

const mockTrackEvent = jest.fn();

jest.mock('../useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: jest.requireActual(
      '../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
  }),
}));

// Drive the region directly so we can flip null -> resolved between renders.
let mockUserRegion: unknown = {
  regionCode: 'us-ca',
  country: { currency: 'USD' },
};
jest.mock('./useRampsUserRegion', () => ({
  useRampsUserRegion: () => ({ userRegion: mockUserRegion }),
}));

function renderScreenViewed(location: string, waitForRegion?: boolean) {
  const store = createRampsMockStore({
    remoteFeatureFlags: { rampsEnabled: true },
  });
  return renderHook(() => useRampsScreenViewed(location, { waitForRegion }), {
    wrapper: createRampsTestWrapper(store),
  });
}

describe('useRampsScreenViewed', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockUserRegion = { regionCode: 'us-ca', country: { currency: 'USD' } };
  });

  it('fires once with the resolved region and never re-fires', () => {
    const { rerender } = renderScreenViewed('Token Selection');

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    const [built] = mockTrackEvent.mock.calls[0];
    expect(built.name).toBe(MetaMetricsEventName.RampsScreenViewed);
    expect(built.properties.location).toBe('Token Selection');
    expect(built.properties.region).toBe('us-ca');

    rerender();
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('defers until the region resolves, then fires exactly once', () => {
    mockUserRegion = null;
    const { rerender } = renderScreenViewed('Amount Input');
    expect(mockTrackEvent).not.toHaveBeenCalled();

    mockUserRegion = { regionCode: 'us-ca', country: { currency: 'USD' } };
    rerender();
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent.mock.calls[0][0].properties.region).toBe('us-ca');

    rerender();
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('fires on mount without waiting when waitForRegion is false', () => {
    mockUserRegion = null;
    renderScreenViewed('Order Details', false);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    const [built] = mockTrackEvent.mock.calls[0];
    expect(built.properties.location).toBe('Order Details');
    expect(built.properties.region).toBe('');
  });

  it('fires once after rampsEnabled becomes true on the same mount', () => {
    mockUserRegion = { regionCode: 'us-ca', country: { currency: 'USD' } };
    const setRampsEnabledRef: {
      current: (enabled: boolean) => void;
    } = { current: () => undefined };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // eslint-disable-next-line @typescript-eslint/naming-convention -- test-only component
    function RampsEnabledTestWrapper({
      children,
    }: {
      children: React.ReactNode;
    }) {
      const [rampsEnabled, setEnabled] = React.useState(false);
      setRampsEnabledRef.current = setEnabled;
      const store = React.useMemo(
        () =>
          createRampsMockStore({
            remoteFeatureFlags: { rampsEnabled },
          }),
        [rampsEnabled],
      );
      return (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </Provider>
      );
    }

    const { rerender } = renderHook(
      () => useRampsScreenViewed('Token Selection'),
      { wrapper: RampsEnabledTestWrapper },
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();

    // Wrap the wrapper's state update so React doesn't warn about an update
    // outside act().
    act(() => {
      setRampsEnabledRef.current(true);
    });
    rerender();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent.mock.calls[0][0].properties.location).toBe(
      'Token Selection',
    );
  });
});
