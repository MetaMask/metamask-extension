import { it } from '@jest/globals';
import { isBrazeConfigured } from '../../shared/lib/braze';
import { OffscreenCommunicationTarget } from '../../shared/constants/offscreen-communication';
import { createOffscreen } from './offscreen';

jest.mock('../../shared/lib/braze', () => ({ isBrazeConfigured: jest.fn() }));
jest.mock('../../shared/lib/sentry', () => ({ captureException: jest.fn() }));

describe('createOffscreen', () => {
  const originalChrome = globalThis.chrome;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.chrome = originalChrome;
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each([
    { configured: true, reasons: ['IFRAME_SCRIPTING', 'WORKERS'] },
    { configured: false, reasons: ['IFRAME_SCRIPTING'] },
  ])(
    'declares worker use when Braze is configured: $configured',
    async ({ configured, reasons }) => {
      jest.mocked(isBrazeConfigured).mockReturnValue(configured);
      let listener: (message: unknown) => void = () => undefined;
      const createDocument = jest.fn(async () => {
        listener({
          target: OffscreenCommunicationTarget.extensionMain,
          isBooted: true,
          webdriverPresent: false,
        });
      });
      globalThis.chrome = {
        runtime: {
          getContexts: jest.fn().mockResolvedValue([]),
          onMessage: {
            addListener: jest.fn((callback: (message: unknown) => void) => {
              listener = callback;
            }),
            removeListener: jest.fn(),
          },
        },
        offscreen: { createDocument },
      } as unknown as typeof chrome;

      await createOffscreen();

      expect(createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          url: './offscreen.html',
          reasons,
        }),
      );
    },
  );
});
