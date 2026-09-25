import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_CHROME,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
import { parsePortInfo } from './parse-port-info';

const RUNTIME_ID = 'extension-id';

jest.mock('webextension-polyfill', () => ({
  runtime: { id: 'extension-id' },
}));

jest.mock('./util', () => ({
  getPlatform: jest.fn(),
}));

const { getPlatform } = jest.requireMock('./util') as {
  getPlatform: jest.Mock;
};

describe('parsePortInfo', () => {
  beforeEach(() => {
    getPlatform.mockReturnValue(PLATFORM_CHROME);
  });

  it('classifies a Chrome extension-origin port as MetaMask UI', () => {
    const OriginalURL = globalThis.URL;
    jest.spyOn(globalThis, 'URL').mockImplementation((input) => {
      const url = new OriginalURL(String(input));
      if (String(input).startsWith('chrome-extension://')) {
        Object.defineProperty(url, 'origin', {
          value: `chrome-extension://${RUNTIME_ID}`,
        });
      }
      return url;
    });

    try {
      const result = parsePortInfo({
        name: ENVIRONMENT_TYPE_POPUP,
        sender: { url: `chrome-extension://${RUNTIME_ID}/popup.html` },
      });

      expect(result.isMetaMaskUIPort).toBe(true);
      expect(result.processName).toBe(ENVIRONMENT_TYPE_POPUP);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('classifies a contentscript port as not MetaMask UI', () => {
    const result = parsePortInfo({
      name: 'contentscript',
      sender: { url: 'https://example.com/page' },
    });

    expect(result.isMetaMaskUIPort).toBe(false);
    expect(result.senderUrl).toEqual(new URL('https://example.com/page'));
  });

  it('returns a null senderUrl when the port has no sender url', () => {
    const result = parsePortInfo({ name: 'contentscript' });

    expect(result.senderUrl).toBeNull();
    expect(result.isMetaMaskUIPort).toBe(false);
  });

  it('classifies Firefox UI ports by process name', () => {
    getPlatform.mockReturnValue(PLATFORM_FIREFOX);

    for (const processName of [
      ENVIRONMENT_TYPE_POPUP,
      ENVIRONMENT_TYPE_NOTIFICATION,
      ENVIRONMENT_TYPE_FULLSCREEN,
    ]) {
      const result = parsePortInfo({
        name: processName,
        sender: { url: 'https://example.com' },
      });

      expect(result.isMetaMaskUIPort).toBe(true);
    }
  });

  it('does not treat a Firefox sidepanel process name as MetaMask UI', () => {
    getPlatform.mockReturnValue(PLATFORM_FIREFOX);

    const result = parsePortInfo({ name: ENVIRONMENT_TYPE_SIDEPANEL });

    expect(result.isMetaMaskUIPort).toBe(false);
  });
});
