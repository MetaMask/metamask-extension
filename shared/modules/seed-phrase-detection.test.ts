import { isSeedPhrase } from './seed-phrase-detection';

describe('Seed Phrase Detection', () => {
  describe('isSeedPhrase', () => {
    describe('valid 12-word seed phrases', () => {
      it('returns true for valid 12-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        expect(isSeedPhrase(seedPhrase)).toBe(true);
      });

      it('handles extra whitespace', () => {
        const seedPhrase =
          '  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  about  ';
        expect(isSeedPhrase(seedPhrase)).toBe(true);
      });

      it('handles mixed case', () => {
        const seedPhrase =
          'Abandon ABANDON abandon Abandon abandon abandon abandon abandon abandon abandon abandon About';
        expect(isSeedPhrase(seedPhrase)).toBe(true);
      });
    });

    describe('valid 24-word seed phrases', () => {
      it('returns true for valid 24-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
        expect(isSeedPhrase(seedPhrase)).toBe(true);
      });
    });

    describe('invalid seed phrases', () => {
      it('returns false for 11 words', () => {
        const text =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
        expect(isSeedPhrase(text)).toBe(false);
      });

      it('returns false for 13 words', () => {
        const text =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about extra';
        expect(isSeedPhrase(text)).toBe(false);
      });

      it('returns false for 15 words (valid BIP39 length but not 12 or 24)', () => {
        const text =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
        expect(isSeedPhrase(text)).toBe(false);
      });

      it('returns false for 12 words with invalid BIP39 words', () => {
        const text =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invalid';
        expect(isSeedPhrase(text)).toBe(false);
      });

      it('returns false for random text', () => {
        const text = 'hello world this is some random text';
        expect(isSeedPhrase(text)).toBe(false);
      });

      it('returns false for empty string', () => {
        expect(isSeedPhrase('')).toBe(false);
      });

      it('returns false for single word', () => {
        expect(isSeedPhrase('abandon')).toBe(false);
      });
    });
  });
});
