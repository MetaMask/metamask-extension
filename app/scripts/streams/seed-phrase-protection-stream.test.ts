import browser from 'webextension-polyfill';
import {
  isExtensionPage,
  sendMetricToBackground,
  SeedPhraseProtectionEventType,
} from './seed-phrase-protection-stream';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Seed Phrase Protection Stream', () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    jest.clearAllMocks();
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

  describe('sendMetricToBackground', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/page',
          hostname: 'example.com',
        },
        writable: true,
      });
    });

    it('should send metric message with correct structure', () => {
      sendMetricToBackground(SeedPhraseProtectionEventType.ModalDisplayed, {
        wordCount: 12,
      });

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SEED_PHRASE_PROTECTION_METRIC',
        event: SeedPhraseProtectionEventType.ModalDisplayed,
        properties: {
          url: 'https://example.com/page',
          hostname: 'example.com',
          wordCount: 12,
        },
      });
    });

    it('should send different event types', () => {
      sendMetricToBackground(SeedPhraseProtectionEventType.ModalDisplayed);
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SeedPhraseProtectionEventType.ModalDisplayed,
        }),
      );

      sendMetricToBackground(SeedPhraseProtectionEventType.ExitSiteClicked);
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SeedPhraseProtectionEventType.ExitSiteClicked,
        }),
      );

      sendMetricToBackground(SeedPhraseProtectionEventType.ProceedAnyway);
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SeedPhraseProtectionEventType.ProceedAnyway,
        }),
      );
    });

    it('should not throw when sendMessage fails', () => {
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      // Should not throw
      expect(() => {
        sendMetricToBackground(SeedPhraseProtectionEventType.ModalDisplayed);
      }).not.toThrow();
    });
  });
});
