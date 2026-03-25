import { normalizeLocalizedNumberInput } from './localeNumber';

describe('localeNumber utils', () => {
  describe('normalizeLocalizedNumberInput', () => {
    it('normalizes de-DE grouped + decimal input', () => {
      expect(normalizeLocalizedNumberInput('45.050,00', 'de-DE')).toBe(
        '45050.00',
      );
    });

    it('normalizes en-US grouped + decimal input', () => {
      expect(normalizeLocalizedNumberInput('45,050.00', 'en-US')).toBe(
        '45050.00',
      );
    });

    it('rejects dot-decimal input in comma-decimal locales', () => {
      expect(normalizeLocalizedNumberInput('45050.75', 'de-DE')).toBeNull();
    });

    it('preserves trailing decimal when requested', () => {
      expect(
        normalizeLocalizedNumberInput('45.050,', 'de-DE', {
          allowTrailingDecimal: true,
        }),
      ).toBe('45050.');
    });

    it('allows partial grouped thousands while typing', () => {
      expect(
        normalizeLocalizedNumberInput('10.0', 'de-DE', {
          allowTrailingDecimal: true,
        }),
      ).toBe('100');
    });

    it('returns null for invalid characters', () => {
      expect(normalizeLocalizedNumberInput('45.0a0', 'en-US')).toBeNull();
    });

    it('treats grouped thousands as integers without decimal', () => {
      expect(normalizeLocalizedNumberInput('45.050', 'de-DE')).toBe('45050');
      expect(normalizeLocalizedNumberInput('45,050', 'en-US')).toBe('45050');
    });

    it('normalizes space/apostrophe-grouped locale inputs', () => {
      expect(normalizeLocalizedNumberInput('45 050,00', 'fr-FR')).toBe(
        '45050.00',
      );
      expect(normalizeLocalizedNumberInput("45'050.00", 'de-CH')).toBe(
        '45050.00',
      );
    });

    it('rejects malformed grouped input', () => {
      expect(normalizeLocalizedNumberInput('1..2', 'de-DE')).toBeNull();
      expect(normalizeLocalizedNumberInput('1,,2', 'en-US')).toBeNull();
    });
  });
});
