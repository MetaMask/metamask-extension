import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { AlertMetricsProvider, useAlertMetrics } from './alertMetricsContext';

const mockTrackAlertActionClicked = jest.fn();
const mockTrackAlertRender = jest.fn();
const mockTrackInlineAlertClicked = jest.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AlertMetricsProvider
    metrics={{
      trackAlertActionClicked: mockTrackAlertActionClicked,
      trackAlertRender: mockTrackAlertRender,
      trackInlineAlertClicked: mockTrackInlineAlertClicked,
    }}
  >
    {children}
  </AlertMetricsProvider>
);

describe('useAlertMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides trackAlertActionClicked, trackAlertRender, and trackInlineAlertClicked functions from context', () => {
    const { result } = renderHook(() => useAlertMetrics(), { wrapper });

    const ALERT_KEY_MOCK = 'testKey';

    expect(result.current).toBeDefined();
    expect(typeof result.current.trackAlertActionClicked).toBe('function');
    expect(typeof result.current.trackAlertRender).toBe('function');
    expect(typeof result.current.trackInlineAlertClicked).toBe('function');

    result.current.trackAlertActionClicked(ALERT_KEY_MOCK);
    result.current.trackAlertRender(ALERT_KEY_MOCK);
    result.current.trackInlineAlertClicked(ALERT_KEY_MOCK);

    expect(mockTrackAlertActionClicked).toHaveBeenCalledWith(ALERT_KEY_MOCK);
    expect(mockTrackAlertRender).toHaveBeenCalledWith(ALERT_KEY_MOCK);
    expect(mockTrackInlineAlertClicked).toHaveBeenCalledWith(ALERT_KEY_MOCK);
  });

  it('throws an error if used outside of AlertMetricsProvider', () => {
    const { result } = renderHook(() => useAlertMetrics());

    expect(result.error).toEqual(
      new Error('useAlertMetrics must be used within an AlertMetricsProvider'),
    );
  });
});
