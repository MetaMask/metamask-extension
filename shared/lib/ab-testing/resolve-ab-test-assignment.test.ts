import { resolveABTestAssignment } from './resolve-ab-test-assignment';

describe('resolveABTestAssignment', () => {
  const validVariants = ['control', 'treatment'] as const;
  const flagKey = 'testTEST1000AbtestPrimaryCta';

  it('returns an active assignment for a valid string flag', () => {
    expect(
      resolveABTestAssignment(
        { [flagKey]: 'treatment' },
        flagKey,
        validVariants,
      ),
    ).toStrictEqual({
      variantName: 'treatment',
      isActive: true,
    });
  });

  it('returns an active assignment for a valid named object flag', () => {
    expect(
      resolveABTestAssignment(
        { [flagKey]: { name: 'control' } },
        flagKey,
        validVariants,
      ),
    ).toStrictEqual({
      variantName: 'control',
      isActive: true,
    });
  });

  it('falls back to control when the flag is missing', () => {
    expect(resolveABTestAssignment({}, flagKey, validVariants)).toStrictEqual({
      variantName: 'control',
      isActive: false,
    });
  });

  it('falls back to control when the flag value is invalid', () => {
    expect(
      resolveABTestAssignment(
        { [flagKey]: 'unexpected' },
        flagKey,
        validVariants,
      ),
    ).toStrictEqual({
      variantName: 'control',
      isActive: false,
    });
  });

  it('falls back to control when feature flags are nullish', () => {
    expect(resolveABTestAssignment(null, flagKey, validVariants)).toStrictEqual(
      {
        variantName: 'control',
        isActive: false,
      },
    );

    expect(
      resolveABTestAssignment(undefined, flagKey, validVariants),
    ).toStrictEqual({
      variantName: 'control',
      isActive: false,
    });
  });

  it('falls back to control when the named object value is invalid', () => {
    expect(
      resolveABTestAssignment(
        { [flagKey]: { name: 'unexpected' } },
        flagKey,
        validVariants,
      ),
    ).toStrictEqual({
      variantName: 'control',
      isActive: false,
    });
  });
});
