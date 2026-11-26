import {
  getDialPrefix,
  PHONE_COUNTRIES,
  formatNational,
  getCountryName,
  getInitialPhone,
  getPhoneCountry,
  isValidNational,
  normalizeNational,
  parsePhoneInput,
  toPhoneNumberValue,
} from './phone';

const US = getPhoneCountry('US');
const CA = getPhoneCountry('CA');
const GB = getPhoneCountry('GB');

describe('phone', () => {
  it('formats as the user types without trailing separators', () => {
    expect(formatNational('4', US)).toBe('(4');
    expect(formatNational('415', US)).toBe('(415');
    expect(formatNational('4155', US)).toBe('(415) 5');
    expect(formatNational('4155552671', US)).toBe('(415) 555-2671');
  });

  it('validates the North American plan and other lengths', () => {
    expect(isValidNational('4155552671', US)).toBe(true);
    expect(isValidNational('1155552671', US)).toBe(false);
    expect(isValidNational('415555267', US)).toBe(false);
    expect(isValidNational('7911123456', GB)).toBe(true);
    expect(isValidNational('791112345', GB)).toBe(false);
  });

  it('produces E.164 output', () => {
    expect(toPhoneNumberValue('4155552671', US)).toStrictEqual({
      e164: '+14155552671',
      country: 'US',
      national: '4155552671',
    });
    expect(toPhoneNumberValue('7911123456', GB).e164).toBe('+447911123456');
  });

  it('drops a pasted leading 1 or dial-out zero and caps the length', () => {
    expect(normalizeNational('1 (415) 555-2671', US)).toBe('4155552671');
    expect(normalizeNational('07911 123456', GB)).toBe('7911123456');
    expect(normalizeNational('41555526719999', US)).toBe('4155552671');
  });

  it('switches country for a pasted international number', () => {
    expect(parsePhoneInput('+44 7911 123456', US)).toStrictEqual({
      country: GB,
      digits: '7911123456',
    });
    expect(parsePhoneInput('tel:+14155552671', CA).country).toBe(CA);
  });

  it('starts from an E.164 or national initial value', () => {
    expect(getInitialPhone('+447911123456').country.iso).toBe('GB');
    expect(getInitialPhone('4155552671', 'US').digits).toBe('4155552671');
    expect(getInitialPhone(undefined).digits).toBe('');
  });

  it('has a template that holds the longest number of each country', () => {
    PHONE_COUNTRIES.forEach((country) => {
      const slots = (country.template.match(/X/gu) ?? []).length;
      expect(slots).toBeGreaterThanOrEqual(country.maxDigits);
    });
  });

  it('gives the English name of a country', () => {
    expect(getCountryName('US')).toBe('United States of America');
    expect(getCountryName('gb')).toBe('United Kingdom');
    expect(getCountryName('ZZ')).toBe('ZZ');
  });
});

describe('the rest of the world', () => {
  it('has unique country codes and numeric calling codes', () => {
    const isos = PHONE_COUNTRIES.map((country) => country.iso);
    expect(new Set(isos).size).toBe(isos.length);
    PHONE_COUNTRIES.forEach((country) => {
      expect(country.callingCode).toMatch(/^[1-9]\d{0,2}$/u);
    });
  });

  it('checks the length of a country without detailed rules', () => {
    const israel = getPhoneCountry('IL');
    expect(isValidNational('501234567', israel)).toBe(true);
    expect(isValidNational('123', israel)).toBe(false);
    expect(isValidNational('1'.repeat(12), israel)).toBe(true);
    expect(isValidNational('1'.repeat(13), israel)).toBe(false);
  });

  it('formats a country without a detailed template', () => {
    expect(formatNational('501234567', getPhoneCountry('IL'))).toBe(
      '501 234 567',
    );
  });

  it('reads a North American territory by its area code', () => {
    const parsed = parsePhoneInput('+1 684 555 1234', getPhoneCountry('US'));
    expect(parsed.country.iso).toBe('AS');
    expect(parsed.digits).toBe('6845551234');
    expect(isValidNational(parsed.digits, parsed.country)).toBe(true);
    expect(toPhoneNumberValue(parsed.digits, parsed.country).e164).toBe(
      '+16845551234',
    );
  });

  it('accepts every area code of a territory, and no other', () => {
    const dominicanRepublic = getPhoneCountry('DO');
    ['8095551234', '8295551234', '8495551234'].forEach((digits) => {
      expect(isValidNational(digits, dominicanRepublic)).toBe(true);
    });
    expect(isValidNational('2125551234', dominicanRepublic)).toBe(false);
    expect(isValidNational('9395551234', getPhoneCountry('PR'))).toBe(true);
    expect(isValidNational('6585551234', getPhoneCountry('JM'))).toBe(true);
    expect(toPhoneNumberValue('8295551234', dominicanRepublic).e164).toBe(
      '+18295551234',
    );
  });

  it('shows the area codes of a territory beside its calling code', () => {
    expect(getDialPrefix(getPhoneCountry('GB'))).toBe('+44');
    expect(getDialPrefix(getPhoneCountry('US'))).toBe('+1');
    expect(getDialPrefix(getPhoneCountry('DO'))).toBe('+1 809, 829, 849');
  });

  it('moves to the US when a US number is pasted over a territory', () => {
    const parsed = parsePhoneInput('+1 415 555 2671', getPhoneCountry('DO'));
    expect(parsed.country.iso).toBe('US');
    expect(isValidNational(parsed.digits, parsed.country)).toBe(true);
  });

  it('keeps a territory for a number with one of its area codes', () => {
    const parsed = parsePhoneInput('+1 829 555 1234', getPhoneCountry('DO'));
    expect(parsed.country.iso).toBe('DO');
    expect(parsed.digits).toBe('8295551234');
  });

  it('keeps Canada for a pasted number no territory owns', () => {
    expect(
      parsePhoneInput('+1 416 555 0100', getPhoneCountry('CA')).country.iso,
    ).toBe('CA');
  });

  it('keeps the current country when a calling code is shared', () => {
    expect(
      parsePhoneInput('+7 912 345 6789', getPhoneCountry('KZ')).country.iso,
    ).toBe('KZ');
    expect(
      parsePhoneInput('+7 912 345 6789', getPhoneCountry('US')).country.iso,
    ).toBe('RU');
  });
});
