import React, { ReactChildren } from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { useAmountSelectionMetrics } from './useAmountSelectionMetrics';

const mockTrackEvent = jest.fn();

const Container = ({ children }: { children: ReactChildren }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

describe('captureAmountSelected', () => {
  it('captures metrics by calling trackEvent', () => {
    const { result } = renderHookWithProvider(
      () => useAmountSelectionMetrics(),
      mockState,
      undefined,
      Container,
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
