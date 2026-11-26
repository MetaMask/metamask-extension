import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { chromium, type BrowserContext } from '@playwright/test';
import {
  MetaMaskExtensionLauncher,
  buildChromiumLaunchArgs,
} from './extension-launcher';

jest.mock('@playwright/test', () => ({
  chromium: { launchPersistentContext: jest.fn() },
}));

jest.mock('@metamask/client-mcp-core', () => ({
  ConsoleErrorBuffer: jest.fn(() => ({ add: jest.fn() })),
  resolveExtensionId: jest.fn().mockResolvedValue('test-extension-id'),
}));

jest.mock('./validate-extension', () => ({
  validateExtensionBuilt: jest.fn(),
}));

jest.mock('./e2e-driver', () => ({
  getE2EDriver: jest.fn(() => ({})),
  withTimeout: jest.fn((driver) => driver),
}));

jest.mock('./launcher/state-inspector', () => ({
  LAUNCH_SCREEN_CHECKS: [],
  SCREEN_CHECKS: [],
  waitForAnyScreen: jest.fn().mockResolvedValue({ description: 'home' }),
}));

const EXTENSION_URL = 'chrome-extension://test-extension-id/home.html';

let tempDir = '';

type FakePage = {
  url: () => string;
  on: jest.Mock;
  waitForLoadState: jest.Mock;
};

type FakeContext = {
  grantPermissions: jest.Mock;
  pages: jest.Mock;
  on: jest.Mock;
  newCDPSession: jest.Mock;
  close: jest.Mock;
  emitPage: (page: FakePage) => void;
};

function createPage(url: string): FakePage {
  return {
    url: () => url,
    on: jest.fn(),
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
  };
}

function createContext(pages: FakePage[]) {
  const pageListeners: ((page: FakePage) => void)[] = [];
  const session = {
    send: jest.fn(async (method: string) =>
      method === 'Browser.getWindowForTarget' ? { windowId: 7 } : {},
    ),
    detach: jest.fn().mockResolvedValue(undefined),
  };
  const context: FakeContext = {
    grantPermissions: jest.fn().mockResolvedValue(undefined),
    pages: jest.fn(() => pages),
    on: jest.fn((_event: string, listener: (page: FakePage) => void) => {
      pageListeners.push(listener);
    }),
    newCDPSession: jest.fn().mockResolvedValue(session),
    close: jest.fn().mockResolvedValue(undefined),
    emitPage: (page: FakePage) => {
      for (const listener of pageListeners) {
        listener(page);
      }
    },
  };

  return { context, session };
}

async function launch(
  context: FakeContext,
  headless: boolean,
  options: {
    viewportWidth?: number;
    viewportHeight?: number;
  } = {},
) {
  jest
    .mocked(chromium.launchPersistentContext)
    .mockResolvedValue(context as unknown as BrowserContext);

  return await new MetaMaskExtensionLauncher({
    headless,
    userDataDir: path.join(tempDir, 'user-data'),
    screenshotDir: path.join(tempDir, 'screenshots'),
    ...options,
  }).launch();
}

async function flushPromises() {
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(async () => {
  jest.clearAllMocks();
  tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'extension-launcher-test-'),
  );
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('buildChromiumLaunchArgs', () => {
  it('adds proxy flag when proxy server is provided', () => {
    const args = buildChromiumLaunchArgs('/tmp/dist/chrome', '127.0.0.1:8000');

    expect(args[0]).toBe('--proxy-server=127.0.0.1:8000');
    expect(args).toContain('--ignore-certificate-errors');
    expect(args).toContain('--allow-insecure-localhost');
    expect(args).toContain('--disable-features=TranslateUI');
  });

  it('does not add proxy flag when proxy server is not provided', () => {
    const args = buildChromiumLaunchArgs('/tmp/dist/chrome');

    expect(args.some((arg) => arg.startsWith('--proxy-server='))).toBe(false);
    expect(args).not.toContain('--ignore-certificate-errors');
    expect(args).not.toContain('--allow-insecure-localhost');
    expect(args).toContain('--disable-features=TranslateUI');
  });

  it('uses full Chromium headless mode when requested', () => {
    const args = buildChromiumLaunchArgs('/tmp/dist/chrome', undefined, true);

    expect(args).toContain('--headless=new');
  });
});

describe('MetaMaskExtensionLauncher headless window size', () => {
  it('sizes existing pages to the viewport in headless mode', async () => {
    const { context, session } = createContext([createPage(EXTENSION_URL)]);

    await launch(context, true, { viewportWidth: 1024, viewportHeight: 768 });

    expect(session.send).toHaveBeenCalledWith('Browser.getWindowForTarget');
    expect(session.send).toHaveBeenCalledWith('Browser.setContentsSize', {
      windowId: 7,
      width: 1024,
      height: 768,
    });
  });

  it('sizes pages opened after launch in headless mode', async () => {
    const { context, session } = createContext([createPage(EXTENSION_URL)]);

    await launch(context, true);
    session.send.mockClear();

    const newPage = createPage(
      'chrome-extension://test-extension-id/sidepanel.html',
    );
    context.emitPage(newPage);
    await flushPromises();

    expect(context.newCDPSession).toHaveBeenCalledWith(newPage);
    expect(session.send).toHaveBeenCalledWith('Browser.setContentsSize', {
      windowId: 7,
      width: 1280,
      height: 800,
    });
  });

  it('does not resize pages in headed mode', async () => {
    const { context, session } = createContext([createPage(EXTENSION_URL)]);

    await launch(context, false);

    expect(context.newCDPSession).not.toHaveBeenCalled();
    expect(session.send).not.toHaveBeenCalled();
  });

  it('does not fail the launch when a CDP call fails', async () => {
    const { context, session } = createContext([createPage(EXTENSION_URL)]);
    session.send.mockRejectedValue(new Error('CDP call failed'));

    await expect(launch(context, true)).resolves.toBeDefined();
  });
});
