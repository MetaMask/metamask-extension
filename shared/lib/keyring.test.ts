import {
  decodeSeedPhraseFromBackground,
  encodeSeedPhraseForBackground,
} from './keyring';

describe('keyring', () => {
  const seedPhrase = 'abandon abandon abandon';

  describe('encodeSeedPhraseForBackground', () => {
    it('encodes a seed phrase as UTF-8 byte values', () => {
      expect(encodeSeedPhraseForBackground(seedPhrase)).toStrictEqual(
        Array.from(Buffer.from(seedPhrase, 'utf8').values()),
      );
    });
  });

  describe('decodeSeedPhraseFromBackground', () => {
    it('decodes a byte array from the background', () => {
      const encoded = encodeSeedPhraseForBackground(seedPhrase);

      expect(decodeSeedPhraseFromBackground(encoded)).toBe(seedPhrase);
    });

    it('decodes a buffer-serialized string from the background', () => {
      const encoded = Buffer.from(seedPhrase, 'utf8').toString();

      expect(decodeSeedPhraseFromBackground(encoded)).toBe(seedPhrase);
    });
  });
});
