import {
  PERPS_SLIPPAGE_DEFAULT_BPS,
  PERPS_SLIPPAGE_MAX_BPS,
  PERPS_SLIPPAGE_MIN_BPS,
  PERPS_SLIPPAGE_STEP_BPS,
  bpsToPercent,
  percentToBps,
} from './slippageConfig';

describe('slippageConfig constants', () => {
  it('uses controller default of 3%', () => {
    expect(PERPS_SLIPPAGE_DEFAULT_BPS).toBe(300);
    expect(bpsToPercent(PERPS_SLIPPAGE_DEFAULT_BPS)).toBe(3);
  });

  it('exposes 0.1% to 10% bounds in 0.1% steps', () => {
    expect(bpsToPercent(PERPS_SLIPPAGE_MIN_BPS)).toBe(0.1);
    expect(bpsToPercent(PERPS_SLIPPAGE_MAX_BPS)).toBe(10);
    expect(bpsToPercent(PERPS_SLIPPAGE_STEP_BPS)).toBe(0.1);
  });

  it('converts percent and bps', () => {
    expect(percentToBps(3)).toBe(300);
    expect(bpsToPercent(300)).toBe(3);
  });
});
