import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import React from 'react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../shared/constants/metametrics';
import { useScreenViewedEvent } from './useScreenViewedEvent';

const mockTrackEvent = jest.fn();

jest.mock('./useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../shared/lib/analytics/create-event-builder',
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

describe('useScreenViewedEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fires once with network_filter on mount', () => {
    renderHook(
      () => useScreenViewedEvent(MetaMetricsEventName.TokenScreenViewed),
      { wrapper: makeWrapper() },
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.TokenScreenViewed,
      properties: {
        category: MetaMetricsEventCategory.Home,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_filter: ['eip155:1'],
      },
      sensitiveProperties: {},
    });
  });

  it('fires at most once per mount even if dependencies change', () => {
    let entryPoint: ScreenViewedEntryPoint | undefined;

    const { rerender } = renderHook(
      () =>
        useScreenViewedEvent(MetaMetricsEventName.DeFiScreenViewed, entryPoint),
      { wrapper: makeWrapper() },
    );

    entryPoint = ScreenViewedEntryPoint.BottomNavClick;
    rerender();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('includes entry_point in properties when entryPoint is provided', () => {
    renderHook(
      () =>
        useScreenViewedEvent(
          MetaMetricsEventName.NftScreenViewed,
          ScreenViewedEntryPoint.SubtabClick,
        ),
      { wrapper: makeWrapper() },
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          entry_point: ScreenViewedEntryPoint.SubtabClick,
        }),
      }),
    );
  });

  it('does not include entry_point in properties when entryPoint is omitted', () => {
    renderHook(
      () => useScreenViewedEvent(MetaMetricsEventName.TokenScreenViewed),
      { wrapper: makeWrapper() },
    );

    const [{ properties }] = mockTrackEvent.mock.calls[0];
    expect(properties).not.toHaveProperty('entry_point');
  });
});
