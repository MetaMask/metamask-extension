import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests to validate messages.json locale files
 * Catches common issues like:
 * - Invalid JSON syntax
 * - Smart/curly quotes that break JSON parsing
 * - Missing required structure
 */
describe('Locale messages.json validation', () => {
  const localesDir = path.join(__dirname, '../../../app/_locales');
  const locales = fs.readdirSync(localesDir).filter((file) => {
    const stat = fs.statSync(path.join(localesDir, file));
    return stat.isDirectory();
  });

  describe('English locale (en/messages.json)', () => {
    const enMessagesPath = path.join(localesDir, 'en', 'messages.json');

    it('should be valid JSON', () => {
      const content = fs.readFileSync(enMessagesPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should not have smart quotes breaking JSON key/value syntax', () => {
      const content = fs.readFileSync(enMessagesPath, 'utf-8');

      // This pattern detects smart quotes used AS string delimiters (breaking JSON)
      // e.g., "key": "value with "smart quotes" inside" <- broken
      // vs    "key": "value with \u201Csmart quotes\u201D inside" <- valid (quotes in content)

      // Check for smart quotes immediately after : or immediately before :
      // which would indicate they're being used as JSON string delimiters
      const brokenDelimiterPattern = /:\s*[\u201C\u201D]|[\u201C\u201D]\s*:/g;
      const match = content.match(brokenDelimiterPattern);

      if (match) {
        throw new Error(
          `Found smart quotes used as JSON delimiters in en/messages.json.\n` +
            `This will break JSON parsing. Replace smart quotes (\u201C\u201D) with regular quotes (")`,
        );
      }
    });

    it('should have the expected structure for each message', () => {
      const content = fs.readFileSync(enMessagesPath, 'utf-8');
      const messages = JSON.parse(content);

      Object.entries(messages).forEach(([key, value]) => {
        expect(typeof value).toBe('object');
        expect(value).toHaveProperty('message');
        expect(typeof (value as { message: string }).message).toBe('string');
      });
    });
  });

  describe('All locale files', () => {
    it.each(locales)('%s/messages.json should be valid JSON', (locale) => {
      const messagesPath = path.join(localesDir, locale, 'messages.json');

      if (!fs.existsSync(messagesPath)) {
        // Skip if messages.json doesn't exist for this locale
        return;
      }

      const content = fs.readFileSync(messagesPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it.each(locales)(
      '%s/messages.json should not have smart quotes breaking JSON syntax',
      (locale) => {
        const messagesPath = path.join(localesDir, locale, 'messages.json');

        if (!fs.existsSync(messagesPath)) {
          return;
        }

        const content = fs.readFileSync(messagesPath, 'utf-8');

        // Check for smart quotes used as JSON delimiters (which breaks parsing)
        // Smart quotes within string values are okay if the JSON parses
        const brokenDelimiterPattern = /:\s*[\u201C\u201D]|[\u201C\u201D]\s*:/g;
        const match = content.match(brokenDelimiterPattern);

        if (match) {
          throw new Error(
            `Found smart quotes used as JSON delimiters in ${locale}/messages.json.\n` +
              `This will break JSON parsing. Replace smart quotes with regular quotes.`,
          );
        }
      },
    );
  });
});
