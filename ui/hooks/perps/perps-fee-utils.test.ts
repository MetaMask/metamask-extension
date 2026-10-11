import {
  applyPerpsFallbackDiscount,
  getPerpsNotionalUsd,
} from './perps-fee-utils';

describe('getPerpsNotionalUsd', () => {
  it('uses the entered USD amount without applying leverage', () => {
    expect(getPerpsNotionalUsd({ usdAmount: '1,000.25' })).toBe(1000.25);
  });

  it('calculates a partial close of a formatted short position', () => {
    expect(
      getPerpsNotionalUsd({ size: '-1,000', price: 20, closePercent: 25 }),
    ).toBe(5000);
  });

  it('uses the controller position value for both legs of a reversal', () => {
    expect(getPerpsNotionalUsd({ usdAmount: '-7,125', multiplier: 2 })).toBe(
      14250,
    );
  });

  it('resolves a TP/SL pair using the largest formatted trigger price', () => {
    expect(getPerpsNotionalUsd({ size: -2, price: ['50,000', '40,000'] })).toBe(
      100000,
    );
  });

  it('uses the remaining trigger when the other trigger is empty', () => {
    expect(getPerpsNotionalUsd({ size: 2, price: ['', '40,000'] })).toBe(80000);
  });

  it('returns zero before an amount or trigger is entered', () => {
    expect(getPerpsNotionalUsd({ usdAmount: '' })).toBe(0);
    expect(getPerpsNotionalUsd({ size: 2, price: ['', ''] })).toBe(0);
  });
});

describe('applyPerpsFallbackDiscount', () => {
  it('discounts a fallback rate', () => {
    expect(applyPerpsFallbackDiscount(0.001, 5000)).toBe(0.0005);
  });

  it('discounts an aggregated fallback amount', () => {
    expect(applyPerpsFallbackDiscount(20, 5000)).toBe(10);
  });

  it('preserves a fallback until a positive discount is available', () => {
    expect(applyPerpsFallbackDiscount(20)).toBe(20);
    expect(applyPerpsFallbackDiscount(20, 0)).toBe(20);
    expect(applyPerpsFallbackDiscount(20, -1)).toBe(20);
  });

  it('waives the fallback at a full discount', () => {
    expect(applyPerpsFallbackDiscount(20, 10000)).toBe(0);
  });
});
