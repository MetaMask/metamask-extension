import {
  computeTotalExposure,
  computeTotalExposureForPermission,
  isPermissionDataWithTotalExposure,
} from './compute-total-exposure';

describe('isPermissionDataWithTotalExposure', () => {
  it('returns true when amountPerSecond is string and startTime is a finite number', () => {
    expect(
      isPermissionDataWithTotalExposure({
        amountPerSecond: '0x1',
        startTime: 1000,
      }),
    ).toBe(true);
  });

  it('returns false when amountPerSecond is missing', () => {
    expect(
      isPermissionDataWithTotalExposure({
        startTime: 1000,
      }),
    ).toBe(false);
  });

  it('returns false when startTime is not a number', () => {
    expect(
      isPermissionDataWithTotalExposure({
        amountPerSecond: '0x1',
        startTime: '1000',
      }),
    ).toBe(false);
  });

  it('returns false when startTime is NaN', () => {
    expect(
      isPermissionDataWithTotalExposure({
        amountPerSecond: '0x1',
        startTime: NaN,
      }),
    ).toBe(false);
  });

  it('returns false when startTime is not finite', () => {
    expect(
      isPermissionDataWithTotalExposure({
        amountPerSecond: '0x1',
        startTime: Infinity,
      }),
    ).toBe(false);
  });
});

describe('computeTotalExposureForPermission', () => {
  it('matches computeTotalExposure for the same fields', () => {
    const data = {
      initialAmount: '0x0' as const,
      maxAmount: '0x32' as const,
      amountPerSecond: '0x1' as const,
      startTime: 1000,
    };
    expect(
      computeTotalExposureForPermission(data, 1100)?.toNumber(),
    ).toStrictEqual(
      computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x32',
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1100,
      })?.toNumber(),
    );
  });
});

describe('computeTotalExposure', () => {
  it('returns maxAmount when less than accrued exposure', () => {
    const result = computeTotalExposure({
      initialAmount: '0x0',
      maxAmount: '0x32', // 50
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 1100, // 100 seconds -> 100 accrued exposure
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x32);
  });

  it('returns maxAmount when less than initialAmount + accrued exposure', () => {
    const result = computeTotalExposure({
      initialAmount: '0x32', // 50
      maxAmount: '0x64', // 100
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 1100, // 100 seconds -> 100 accrued exposure
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x64);
  });

  it('returns initialAmount + accrued exposure when it is less than maxAmount', () => {
    const result = computeTotalExposure({
      initialAmount: '0x14', // 20
      maxAmount: '0x100', // 256
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 1100, // 100 seconds -> 100 accrued exposure
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x14 + 100);
  });

  it('returns initialAmount + accrued exposure when no maxAmount is set', () => {
    const result = computeTotalExposure({
      initialAmount: '0x64', // 100
      maxAmount: undefined,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 1100, // 100 seconds -> 100 accrued exposure
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x64 + 100);
  });

  it('returns maxAmount when no expiry is set', () => {
    const result = computeTotalExposure({
      initialAmount: '0x0',
      maxAmount: '0x64', // 100
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: null,
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x64);
  });

  it('returns null (unlimited) when neither maxAmount nor expiry is set', () => {
    const result = computeTotalExposure({
      initialAmount: '0x64',
      maxAmount: undefined,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: null,
    });
    expect(result).toBeNull();
  });

  it('returns initial amount only when elapsed seconds is zero', () => {
    const result = computeTotalExposure({
      initialAmount: '0x64', // 100
      maxAmount: undefined,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 1000, // 0 seconds elapsed
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x64);
  });

  it('parses hex amounts correctly', () => {
    const result = computeTotalExposure({
      initialAmount: '0x0',
      maxAmount: '0x100',
      amountPerSecond: '0x2',
      startTime: 0,
      expiry: 10,
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x2 * 10);
  });

  it('returns null (unlimited) only when maxAmount is max uint256 and expiry is null', () => {
    const maxUint256 =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const result = computeTotalExposure({
      initialAmount: '0x0',
      maxAmount: maxUint256,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: null,
    });
    expect(result).toBeNull();
  });

  it('returns exposure at expiry (not null) when expiry is set even if maxAmount is max uint256', () => {
    const maxUint256 =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const result = computeTotalExposure({
      initialAmount: '0x0',
      maxAmount: maxUint256,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 1050, // 50 seconds
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(50);
  });

  it('returns null (unlimited) when maxAmount is max uint256 in uppercase hex and expiry is null', () => {
    const maxUint256Upper =
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
    const result = computeTotalExposure({
      initialAmount: '0x0',
      maxAmount: maxUint256Upper,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: null,
    });
    expect(result).toBeNull();
  });

  it('treats undefined initialAmount as zero for exposure at expiry', () => {
    const result = computeTotalExposure({
      initialAmount: undefined,
      maxAmount: undefined,
      amountPerSecond: '0x1',
      startTime: 0,
      expiry: 10, // 10 seconds
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(10);
  });

  it('returns initial only when elapsed is negative (expiry before startTime)', () => {
    const result = computeTotalExposure({
      initialAmount: '0x64', // 100
      maxAmount: undefined,
      amountPerSecond: '0x1',
      startTime: 1000,
      expiry: 500, // 500 seconds before start
    });
    expect(result).not.toBeNull();
    expect(result?.toNumber()).toBe(0x64);
  });
});
