import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import React from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useActivityScreenViewed } from './useActivityScreenViewed';
import type { ActivityListFilter } from './helpers';

const mockTrackEvent = jest.fn();

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

function createStore() {
  return configureMockStore()({
    metamask: {
      enabledNetworkMap: { eip155: { '0x1': true } },
    },
  });
}

function makeWrapper() {
  const store = createStore();
  return function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

const defaultProps = {
  filter: undefined as ActivityListFilter | undefined,
  isSettled: true,
  isEmpty: true,
  pendingLength: 0,
};

describe('useActivityScreenViewed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fire when isSettled is false', () => {
    renderHook(
      () => useActivityScreenViewed({ ...defaultProps, isSettled: false }),
      { wrapper: makeWrapper() },
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('fires once with is_empty: true when the list has no items', () => {
    renderHook(() => useActivityScreenViewed(defaultProps), {
      wrapper: makeWrapper(),
    });

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.ActivityScreenViewed,
      properties: {
        category: MetaMetricsEventCategory.Home,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_filter: ['eip155:1'],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_empty: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pending_transactions: 0,
      },
      sensitiveProperties: {},
    });
  });

  it('fires with correct properties when items are present', () => {
    renderHook(
      () =>
        useActivityScreenViewed({
          ...defaultProps,
          isEmpty: false,
          pendingLength: 3,
        }),
      { wrapper: makeWrapper() },
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_empty: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          pending_transactions: 3,
        }),
      }),
    );
  });

  it('fires at most once per mount even if isSettled cycles', () => {
    let isSettled = true;

    const { rerender } = renderHook(
      () => useActivityScreenViewed({ ...defaultProps, isSettled }),
      { wrapper: makeWrapper() },
    );

    isSettled = false;
    rerender();
    isSettled = true;
    rerender();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('does not fire when a filter prop is provided (embedded view)', () => {
    renderHook(
      () =>
        useActivityScreenViewed({
          ...defaultProps,
          filter: { networks: ['eip155:1'] },
        }),
      { wrapper: makeWrapper() },
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
