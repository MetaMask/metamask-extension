import React from 'react';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import {
  AlertsActionMetrics,
  UseAlertSystemMetricsProps,
} from '../../../../pages/confirmations/hooks/useConfirmationAlertMetrics';
import { useAlertMetrics } from './alertMetricsContext';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useAlertMetrics', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('provides trackAlertMetrics function from context', () => {
    (React.useContext as jest.Mock).mockReturnValue({
      trackAlertMetrics: jest.fn(),
    });
    const { result } = renderHookWithProvider(useAlertMetrics);

    expect(result.current).toBeDefined();
    expect(result.current.trackAlertMetrics).toBeDefined();
    expect(typeof result.current.trackAlertMetrics).toBe('function');

    const mockProps: UseAlertSystemMetricsProps = {
      alertKey: 'testKey',
      action: AlertsActionMetrics.InlineAlertClicked,
    };
    expect(() => result.current.trackAlertMetrics(mockProps)).not.toThrow();
  });

  it('throws an error if used outside of AlertMetricsProvider', () => {
    const { result } = renderHookWithProvider(() => useAlertMetrics());
    expect(result.error).toEqual(
      new Error('useAlertMetrics must be used within an AlertMetricsProvider'),
    );
  });
});
