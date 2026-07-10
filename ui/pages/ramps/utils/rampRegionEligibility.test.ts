import type { Country, UserRegion } from '@metamask/ramps-controller';
import { isRampRegionDefinitivelyUnsupported } from './rampRegionEligibility';

const country = (over: Partial<Country> = {}): Country =>
  ({
    isoCode: 'US',
    flag: '🇺🇸',
    name: 'United States',
    phone: { prefix: '+1', placeholder: '' } as Country['phone'],
    currency: 'USD',
    supported: { buy: true, sell: true },
    ...over,
  }) as Country;

const region = (over: Partial<UserRegion> = {}): UserRegion => ({
  country: country(),
  state: null,
  regionCode: 'us',
  ...over,
});

describe('isRampRegionDefinitivelyUnsupported', () => {
  it('uses the US state buy flag when present (unsupported state)', () => {
    const r = region({
      country: country({ isoCode: 'US' }),
      state: { stateId: 'NY', supported: { buy: false, sell: false } },
      regionCode: 'us-ny',
    });
    expect(isRampRegionDefinitivelyUnsupported(r, [r.country])).toBe(true);
  });

  it('uses the US state buy flag when present (supported state)', () => {
    const r = region({
      state: { stateId: 'CA', supported: { buy: true, sell: false } },
      regionCode: 'us-ca',
    });
    expect(isRampRegionDefinitivelyUnsupported(r, [r.country])).toBe(false);
  });

  it('falls back to the country buy flag when no state flag', () => {
    const r = region({
      country: country({
        isoCode: 'FR',
        supported: { buy: false, sell: false },
      }),
      regionCode: 'fr',
    });
    expect(isRampRegionDefinitivelyUnsupported(r, [r.country])).toBe(true);
  });

  it('falls back to membership in the countries list', () => {
    const r = region({
      country: country({
        isoCode: 'ZZ',
        supported: {} as Country['supported'],
      }),
      regionCode: 'zz',
    });
    // absent from list => unsupported
    expect(
      isRampRegionDefinitivelyUnsupported(r, [country({ isoCode: 'US' })]),
    ).toBe(true);
    // present in list => supported
    expect(isRampRegionDefinitivelyUnsupported(r, [r.country])).toBe(false);
  });

  it('fails open when region is null', () => {
    expect(isRampRegionDefinitivelyUnsupported(null, [])).toBe(false);
  });

  it('fails open when countries list is empty and no explicit flags', () => {
    const r = region({
      country: country({
        isoCode: 'ZZ',
        supported: {} as Country['supported'],
      }),
    });
    expect(isRampRegionDefinitivelyUnsupported(r, [])).toBe(false);
  });
});
