import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { PerpsAttributionProvider } from '../../providers/perps/PerpsAttributionContext';
import { usePerpsAttribution } from './usePerpsAttribution';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(PerpsAttributionProvider, null, children);
}

describe('usePerpsAttribution', () => {
  it('builds tracking data with VIP fields and flow attribution', () => {
    const { result } = renderHook(() => usePerpsAttribution(), { wrapper });

    act(() => {
      result.current.setFlowAttribution({
        entryPoint: 'market_list',
        discoverySource: 'market_list',
      });
    });

    expect(
      result.current.buildTrackingData({
        totalFee: 1.5,
        marketPrice: 3000,
        vipTier: 2,
        vipDiscount: 25,
        hlFeeRate: 0.0004,
      }),
    ).toStrictEqual({
      totalFee: 1.5,
      marketPrice: 3000,
      vipTier: 2,
      vipDiscount: 25,
      hlFeeRate: 0.0004,
      entryPoint: 'market_list',
      discoverySource: 'market_list',
    });
  });

  it('builds TP/SL tracking data with flow attribution', () => {
    const { result } = renderHook(() => usePerpsAttribution(), { wrapper });

    act(() => {
      result.current.setFlowAttribution({ entryPoint: 'asset_details' });
    });

    expect(
      result.current.buildTpslTrackingData({
        direction: 'long',
        source: 'asset_details',
        positionSize: 0.5,
      }),
    ).toStrictEqual({
      direction: 'long',
      source: 'asset_details',
      positionSize: 0.5,
      entryPoint: 'asset_details',
    });
  });
});
