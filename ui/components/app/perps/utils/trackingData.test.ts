import { buildPerpsVipTrackingData } from './trackingData';

describe('buildPerpsVipTrackingData', () => {
  const baseFee = 1.23;
  const basePrice = 3000;

  it('includes vipTier and vipDiscount when both are present', () => {
    const result = buildPerpsVipTrackingData({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: 2,
      vipDiscount: 50,
    });

    expect(result).toStrictEqual({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: 2,
      vipDiscount: 50,
    });
  });

  it('omits both vipTier and vipDiscount when absent', () => {
    const result = buildPerpsVipTrackingData({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: null,
      vipDiscount: undefined,
    });

    expect(result).toStrictEqual({
      totalFee: baseFee,
      marketPrice: basePrice,
    });
    expect(result).not.toHaveProperty('vipTier');
    expect(result).not.toHaveProperty('vipDiscount');
  });

  it('includes vipTier but omits vipDiscount when only tier is present', () => {
    const result = buildPerpsVipTrackingData({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: 3,
      vipDiscount: undefined,
    });

    expect(result).toStrictEqual({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: 3,
    });
    expect(result).not.toHaveProperty('vipDiscount');
  });

  it('includes vipDiscount but omits vipTier when only discount is present', () => {
    const result = buildPerpsVipTrackingData({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: null,
      vipDiscount: 25,
    });

    expect(result).toStrictEqual({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipDiscount: 25,
    });
    expect(result).not.toHaveProperty('vipTier');
  });

  it('includes vipTier when tier is 0 (falsy but not null)', () => {
    const result = buildPerpsVipTrackingData({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: 0,
      vipDiscount: undefined,
    });

    expect(result).toStrictEqual({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: 0,
    });
  });

  it('includes vipDiscount when discount is 0 (falsy but not undefined)', () => {
    const result = buildPerpsVipTrackingData({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipTier: null,
      vipDiscount: 0,
    });

    expect(result).toStrictEqual({
      totalFee: baseFee,
      marketPrice: basePrice,
      vipDiscount: 0,
    });
  });
});
