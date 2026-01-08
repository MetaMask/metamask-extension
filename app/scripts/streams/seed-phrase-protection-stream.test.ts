import { isExtensionPage } from './seed-phrase-protection-stream';

describe('Seed Phrase Protection Stream', () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  describe('isExtensionPage', () => {
    it('should return true for chrome-extension:// protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'chrome-extension:',
          origin: 'chrome-extension://abcdefghijklmnop',
        },
        writable: true,
      });

      expect(isExtensionPage()).toBe(true);
    });

    it('should return true for moz-extension:// protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'moz-extension:',
          origin: 'moz-extension://abcdefghijklmnop',
        },
        writable: true,
      });

      expect(isExtensionPage()).toBe(true);
    });

    it('should return false for https:// protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
          origin: 'https://example.com',
        },
        writable: true,
      });

      expect(isExtensionPage()).toBe(false);
    });

    it('should return false for http:// protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          origin: 'http://localhost:3000',
        },
        writable: true,
      });

      expect(isExtensionPage()).toBe(false);
    });

    it('should return true for null origin with extension protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'chrome-extension:',
          origin: 'null',
        },
        writable: true,
      });

      expect(isExtensionPage()).toBe(true);
    });

    it('should return false for file:// protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'file:',
          origin: 'null',
        },
        writable: true,
      });

      expect(isExtensionPage()).toBe(false);
    });
  });
});
