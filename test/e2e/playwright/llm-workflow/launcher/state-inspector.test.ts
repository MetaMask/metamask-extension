import type { Page } from '@playwright/test';
import { detectScreenFromUrl, getExtensionState } from './state-inspector';

describe('state-inspector', () => {
  describe('detectScreenFromUrl', () => {
    it('detects screens from hash routes', () => {
      expect(detectScreenFromUrl('chrome-extension://id/home.html#/send')).toBe(
        'send',
      );
      expect(detectScreenFromUrl('chrome-extension://id/home.html#/swap')).toBe(
        'swap',
      );
      expect(
        detectScreenFromUrl('chrome-extension://id/home.html#/settings'),
      ).toBe('settings');
    });
  });

  describe('getExtensionState', () => {
    it('throws when extension is not initialized', async () => {
      await expect(
        getExtensionState(undefined, { extensionId: undefined, chainId: 1 }),
      ).rejects.toThrow('Extension not initialized');
    });

    it('returns state snapshot when page is available', async () => {
      const page = {
        url: jest.fn().mockReturnValue('chrome-extension://id/home.html'),
        locator: jest.fn().mockReturnValue({
          isVisible: jest.fn().mockResolvedValue(false),
        }),
      } as unknown as Page;

      const state = await getExtensionState(page, {
        extensionId: 'a'.repeat(32),
        chainId: 1,
      });

      expect(state.isLoaded).toBe(true);
      expect(state.extensionId).toBe('a'.repeat(32));
      expect(state.chainId).toBe(1);
      expect(state.currentScreen).toBe('unknown');
    });
  });
});
