import type { ExtensionIdResolverDeps } from './extension-id-resolver';
import { resolveExtensionId } from './extension-id-resolver';

describe('resolveExtensionId', () => {
  it('returns the extension id from an existing service worker', async () => {
    const log = { info: jest.fn(), warn: jest.fn() };
    const extensionId = 'a'.repeat(32);
    const context = {
      serviceWorkers: () => [
        { url: () => `chrome-extension://${extensionId}/background.js` },
      ],
      waitForEvent: jest.fn(),
      pages: () => [],
      newPage: jest.fn(),
    };

    const result = await resolveExtensionId({
      context: context as unknown as ExtensionIdResolverDeps['context'],
      log,
    });

    expect(result).toBe(extensionId);
    expect(log.info).toHaveBeenCalled();
  });

  it('falls back to extensions page when no service worker exists', async () => {
    const log = { info: jest.fn(), warn: jest.fn() };
    const evaluate = jest.fn().mockResolvedValue('a'.repeat(32));
    const page = {
      goto: jest.fn(),
      waitForLoadState: jest.fn(),
      evaluate,
    };
    const context = {
      serviceWorkers: () => [],
      waitForEvent: jest.fn().mockResolvedValue(null),
      pages: () => [page],
      newPage: jest.fn().mockResolvedValue(page),
    };

    const result = await resolveExtensionId({
      context: context as unknown as ExtensionIdResolverDeps['context'],
      log,
    });

    expect(result).toBe('a'.repeat(32));
    expect(log.info).toHaveBeenCalled();
  });
});
