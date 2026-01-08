import {
  detectSeedPhrase,
  isPotentialSeedPhrase,
  isDefinitelySeedPhrase,
} from './seed-phrase-detection';

describe('Seed Phrase Detection Module', () => {
  // Valid 12-word seed phrases (using real BIP39 words)
  const VALID_12_WORD_PHRASE =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const VALID_24_WORD_PHRASE =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

  // Invalid phrases
  const INVALID_WORDS_PHRASE =
    'hello world test invalid words that are not bip39 compatible words here twelve';
  const TOO_FEW_WORDS = 'abandon abandon abandon';
  const MIXED_VALID_INVALID =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invalidword';

  describe('detectSeedPhrase', () => {
    it('should detect a valid 12-word seed phrase with high confidence', () => {
      const result = detectSeedPhrase(VALID_12_WORD_PHRASE);

      expect(result.isSeedPhrase).toBe(true);
      expect(result.wordCount).toBe(12);
      expect(result.isValidLength).toBe(true);
      expect(result.allWordsValid).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should detect a valid 24-word seed phrase with high confidence', () => {
      const result = detectSeedPhrase(VALID_24_WORD_PHRASE);

      expect(result.isSeedPhrase).toBe(true);
      expect(result.wordCount).toBe(24);
      expect(result.isValidLength).toBe(true);
      expect(result.allWordsValid).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('should detect a valid 15-word seed phrase with medium confidence', () => {
      const phrase =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const result = detectSeedPhrase(phrase);

      expect(result.isSeedPhrase).toBe(true);
      expect(result.wordCount).toBe(15);
      expect(result.isValidLength).toBe(true);
      expect(result.allWordsValid).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('should not detect a phrase with too few words', () => {
      const result = detectSeedPhrase(TOO_FEW_WORDS);

      expect(result.isSeedPhrase).toBe(false);
      expect(result.wordCount).toBe(3);
      expect(result.isValidLength).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should not detect a phrase with invalid BIP39 words', () => {
      const result = detectSeedPhrase(INVALID_WORDS_PHRASE);

      expect(result.isSeedPhrase).toBe(false);
      expect(result.wordCount).toBe(12);
      expect(result.isValidLength).toBe(true);
      expect(result.allWordsValid).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should not detect a phrase with mixed valid and invalid words', () => {
      const result = detectSeedPhrase(MIXED_VALID_INVALID);

      expect(result.isSeedPhrase).toBe(false);
      expect(result.wordCount).toBe(12);
      expect(result.isValidLength).toBe(true);
      expect(result.allWordsValid).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should handle empty string', () => {
      const result = detectSeedPhrase('');

      expect(result.isSeedPhrase).toBe(false);
      expect(result.wordCount).toBe(0);
      expect(result.isValidLength).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should handle whitespace-only string', () => {
      const result = detectSeedPhrase('   \n\t  ');

      expect(result.isSeedPhrase).toBe(false);
      expect(result.wordCount).toBe(0);
      expect(result.isValidLength).toBe(false);
      expect(result.confidence).toBe('none');
    });

    it('should normalize text with extra whitespace', () => {
      const phraseWithExtraSpaces =
        '  abandon   abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon   about  ';
      const result = detectSeedPhrase(phraseWithExtraSpaces);

      expect(result.isSeedPhrase).toBe(true);
      expect(result.wordCount).toBe(12);
      expect(result.confidence).toBe('high');
    });

    it('should normalize uppercase text', () => {
      const uppercasePhrase =
        'ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABOUT';
      const result = detectSeedPhrase(uppercasePhrase);

      expect(result.isSeedPhrase).toBe(true);
      expect(result.wordCount).toBe(12);
      expect(result.confidence).toBe('high');
    });

    it('should normalize mixed case text', () => {
      const mixedCasePhrase =
        'Abandon ABANDON abandon ABANDON Abandon ABANDON abandon ABANDON Abandon ABANDON abandon About';
      const result = detectSeedPhrase(mixedCasePhrase);

      expect(result.isSeedPhrase).toBe(true);
      expect(result.wordCount).toBe(12);
      expect(result.confidence).toBe('high');
    });
  });

  describe('isPotentialSeedPhrase', () => {
    it('should return true for valid 12-word phrase', () => {
      expect(isPotentialSeedPhrase(VALID_12_WORD_PHRASE)).toBe(true);
    });

    it('should return true for valid 24-word phrase', () => {
      expect(isPotentialSeedPhrase(VALID_24_WORD_PHRASE)).toBe(true);
    });

    it('should return false for invalid phrase', () => {
      expect(isPotentialSeedPhrase(INVALID_WORDS_PHRASE)).toBe(false);
    });

    it('should return false for too few words', () => {
      expect(isPotentialSeedPhrase(TOO_FEW_WORDS)).toBe(false);
    });
  });

  describe('isDefinitelySeedPhrase', () => {
    it('should return true for valid 12-word phrase', () => {
      expect(isDefinitelySeedPhrase(VALID_12_WORD_PHRASE)).toBe(true);
    });

    it('should return true for valid 24-word phrase', () => {
      expect(isDefinitelySeedPhrase(VALID_24_WORD_PHRASE)).toBe(true);
    });

    it('should return false for 15-word phrase (not common length)', () => {
      const phrase =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(isDefinitelySeedPhrase(phrase)).toBe(false);
    });

    it('should return false for invalid phrase', () => {
      expect(isDefinitelySeedPhrase(INVALID_WORDS_PHRASE)).toBe(false);
    });

    it('should return false for too few words', () => {
      expect(isDefinitelySeedPhrase(TOO_FEW_WORDS)).toBe(false);
    });

    it('should return false for regular text that happens to be 12 words', () => {
      const regularText =
        'The quick brown fox jumps over the lazy dog near the river';
      expect(isDefinitelySeedPhrase(regularText)).toBe(false);
    });
  });
});

