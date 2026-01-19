import { SENSITIVE_FIELD_PATTERNS, isSensitiveField } from './redaction';

describe('utils/redaction', () => {
  describe('SENSITIVE_FIELD_PATTERNS', () => {
    it('contains expected patterns', () => {
      expect(SENSITIVE_FIELD_PATTERNS).toContainEqual(expect.any(RegExp));
      expect(SENSITIVE_FIELD_PATTERNS.length).toBeGreaterThan(0);
    });
  });

  describe('isSensitiveField', () => {
    it('identifies password fields', () => {
      expect(isSensitiveField('password')).toBe(true);
      expect(isSensitiveField('user_password')).toBe(true);
      expect(isSensitiveField('PASSWORD')).toBe(true);
    });

    it('identifies seed phrase fields', () => {
      expect(isSensitiveField('seed')).toBe(true);
      expect(isSensitiveField('seedPhrase')).toBe(true);
      expect(isSensitiveField('mnemonic')).toBe(true);
    });

    it('identifies key fields', () => {
      expect(isSensitiveField('privateKey')).toBe(true);
      expect(isSensitiveField('secretKey')).toBe(true);
      expect(isSensitiveField('apiKey')).toBe(true);
    });

    it('identifies SRP fields', () => {
      expect(isSensitiveField('srp')).toBe(true);
      expect(isSensitiveField('SRP')).toBe(true);
    });

    it('does not flag normal fields', () => {
      expect(isSensitiveField('username')).toBe(false);
      expect(isSensitiveField('email')).toBe(false);
      expect(isSensitiveField('address')).toBe(false);
      expect(isSensitiveField('balance')).toBe(false);
      expect(isSensitiveField('testId')).toBe(false);
    });

    it('handles empty string', () => {
      expect(isSensitiveField('')).toBe(false);
    });
  });
});
