/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import {
  ASSET_VIEWED_IMPLEMENTATION_TYPE_NATIVE,
  ASSET_VIEWED_PROPERTY,
  mergeAssetViewedProperties,
  shouldEmitAssetViewedForPerpsScreenViewed,
} from './assetViewedAnalytics';

describe('mergeAssetViewedProperties', () => {
  it('appends trade_type and implementation_type after base properties', () => {
    expect(
      mergeAssetViewedProperties('Swaps', { chain_id_source: '1' }),
    ).toStrictEqual({
      chain_id_source: '1',
      [ASSET_VIEWED_PROPERTY.TRADE_TYPE]: 'Swaps',
      [ASSET_VIEWED_PROPERTY.IMPLEMENTATION_TYPE]:
        ASSET_VIEWED_IMPLEMENTATION_TYPE_NATIVE,
    });
  });

  it('does not let base properties override unified keys', () => {
    expect(
      mergeAssetViewedProperties('Perps', {
        trade_type: 'should-not-win',
        implementation_type: 'should-not-win',
      }),
    ).toStrictEqual({
      trade_type: 'Perps',
      implementation_type: 'native',
    });
  });

  it('maps Perps open_position to open_positions_count on Asset Viewed', () => {
    expect(
      mergeAssetViewedProperties('Perps', {
        open_position: 3,
        screen_type: 'home',
      }),
    ).toStrictEqual({
      screen_type: 'home',
      [ASSET_VIEWED_PROPERTY.OPEN_POSITIONS_COUNT]: 3,
      [ASSET_VIEWED_PROPERTY.TRADE_TYPE]: 'Perps',
      [ASSET_VIEWED_PROPERTY.IMPLEMENTATION_TYPE]:
        ASSET_VIEWED_IMPLEMENTATION_TYPE_NATIVE,
    });
  });

  it('maps openPositionsCount camelCase to open_positions_count on Asset Viewed', () => {
    expect(mergeAssetViewedProperties('Perps', { openPositionsCount: 2 })).toStrictEqual(
      {
        [ASSET_VIEWED_PROPERTY.OPEN_POSITIONS_COUNT]: 2,
        [ASSET_VIEWED_PROPERTY.TRADE_TYPE]: 'Perps',
        [ASSET_VIEWED_PROPERTY.IMPLEMENTATION_TYPE]:
          ASSET_VIEWED_IMPLEMENTATION_TYPE_NATIVE,
      },
    );
  });
});

describe('shouldEmitAssetViewedForPerpsScreenViewed', () => {
  it('returns false for cancel_all_orders screen_type', () => {
    expect(
      shouldEmitAssetViewedForPerpsScreenViewed({
        screen_type: 'cancel_all_orders',
        open_position: 3,
      }),
    ).toBe(false);
  });

  it('returns true for other perps screen types', () => {
    expect(
      shouldEmitAssetViewedForPerpsScreenViewed({
        screen_type: 'wallet_home_perps_tab',
      }),
    ).toBe(true);
  });
});
