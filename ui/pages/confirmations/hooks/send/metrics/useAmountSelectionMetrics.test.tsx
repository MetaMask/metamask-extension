import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useAmountSelectionMetrics } from './useAmountSelectionMetrics';

const mockTrackEvent = jest.fn();

jest.mock('../../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

describe('captureAmountSelected', () => {
  it('captures metrics by calling trackEvent', () => {
    const { result } = renderHookWithProvider(
      () => useAmountSelectionMetrics(),
      mockState,
    );
    result.current.captureAmountSelected();
    expect(mockTrackEvent).toHaveBeenCalled();
  });
});

describe('useAmountSelectionMetrics', () => {
  it('return field for capturing amount metrics related details', () => {
    const { result } = renderHookWithProvider(
      () => useAmountSelectionMetrics(),
      mockState,
    );
    expect(result.current.captureAmountSelected).toBeDefined();
    expect(result.current.setAmountInputMethodManual).toBeDefined();
    expect(result.current.setAmountInputMethodPressedMax).toBeDefined();
    expect(result.current.setAmountInputTypeFiat).toBeDefined();
    expect(result.current.setAmountInputTypeToken).toBeDefined();
  });
});
