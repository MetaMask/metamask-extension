import React from 'react';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { useAlertMetrics } from './alertMetricsContext';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useAlertMetrics', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('provides trackAlertActionClicked, trackAlertRender, and trackInlineAlertClicked functions from context', () => {
    (React.useContext as jest.Mock).mockReturnValue({
      trackAlertActionClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackInlineAlertClicked: jest.fn(),
    });
    const ALERT_KEY_MOCK = 'testKey';
    const { result } = renderHookWithProvider(useAlertMetrics);

    expect(result.current).toBeDefined();
    expect(typeof result.current.trackAlertActionClicked).toBe('function');
    expect(typeof result.current.trackAlertRender).toBe('function');
    expect(typeof result.current.trackInlineAlertClicked).toBe('function');

    expect(() =>
      result.current.trackAlertActionClicked(ALERT_KEY_MOCK),
    ).not.toThrow();
    expect(() => result.current.trackAlertRender(ALERT_KEY_MOCK)).not.toThrow();
    expect(() =>
      result.current.trackInlineAlertClicked(ALERT_KEY_MOCK),
    ).not.toThrow();
  });

  it('throws an error if used outside of AlertMetricsProvider', () => {
    const { result } = renderHookWithProvider(() => useAlertMetrics());
    expect(result.error).toEqual(
      new Error('useAlertMetrics must be used within an AlertMetricsProvider'),
    );
  });
});
