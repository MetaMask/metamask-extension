import React, { ReactChildren } from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { useAssetSelectionMetrics } from './useAssetSelectionMetrics';
import { EVM_ASSET } from '../../../../../../test/data/send/assets';

const mockTrackEvent = jest.fn();

const Container = ({ children }: { children: ReactChildren }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

describe('useAssetSelectionMetrics', () => {
  it('captures metrics by calling trackEvent', () => {
    const { result } = renderHookWithProvider(
      () => useAssetSelectionMetrics(),
      mockState,
      undefined,
      Container,
    );
    result.current.captureAssetSelected(EVM_ASSET, 1);
    expect(mockTrackEvent).toHaveBeenCalled();
  });
});

describe('useAssetSelectionMetrics', () => {
  it('return field getting asset selection related details', () => {
    const { result } = renderHookWithProvider(
      () => useAssetSelectionMetrics(),
      mockState,
    );
    expect(result.current.captureAssetSelected).toBeDefined();
    expect(result.current.setAssetListSize).toBeDefined();
    expect(result.current.setNoneAssetFilterMethod).toBeDefined();
    expect(result.current.setSearchAssetFilterMethod).toBeDefined();
  });
});
