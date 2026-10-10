/** @jest-environment node */

export {};

const isolationFlags = [
  '--disable-gpu',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-background-timer-throttling',
];

describe('ChromeDriver.build', () => {
  let ChromeDriver: Awaited<typeof import('../webdriver/chrome.js')>;
  let optionsInstance: { args?: string[]; [key: string]: unknown };
  let serviceInstance: Record<string, unknown>;
  let builderInstance: Record<string, unknown>;
  let addArgumentsMock: jest.Mock;

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv, HEADLESS: 'false' };

    addArgumentsMock = jest.fn((args) => {
      optionsInstance.args = args;
      return optionsInstance;
    });

    optionsInstance = {
      addArguments: addArgumentsMock,
      setAcceptInsecureCerts: jest.fn(() => optionsInstance),
      setUserPreferences: jest.fn(() => optionsInstance),
      setBrowserVersion: jest.fn(() => optionsInstance),
      setLocalState: jest.fn(() => optionsInstance),
    };

    serviceInstance = {
      setStdio: jest.fn(() => serviceInstance),
      enableChromeLogging: jest.fn(() => serviceInstance),
      setPort: jest.fn(() => serviceInstance),
    };

    builderInstance = {
      forBrowser: jest.fn(() => builderInstance),
      setChromeOptions: jest.fn(() => builderInstance),
      setChromeService: jest.fn(() => builderInstance),
      build: jest.fn(() => ({})),
    };

    jest.doMock('selenium-webdriver/chrome', () => ({
      Options: jest.fn(() => optionsInstance),
      ServiceBuilder: jest.fn(() => serviceInstance),
    }));

    jest.doMock('selenium-webdriver', () => ({
      Builder: jest.fn(() => builderInstance),
    }));

    // eslint-disable-next-line import-x/extensions
    ({ default: ChromeDriver } = await import('../webdriver/chrome.js'));
    jest
      .spyOn(ChromeDriver, '_computeExtensionId')
      .mockReturnValue('abcdefghijklmnopabcdefghijklmnop');
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('adds Chrome isolation flags in CI', async () => {
    process.env.CI = 'true';

    await ChromeDriver.build({});

    expect(optionsInstance.args).toEqual(
      expect.arrayContaining(isolationFlags),
    );
  });

  it('does not add Chrome isolation flags outside CI', async () => {
    delete process.env.CI;
    delete process.env.CODESPACES;

    await ChromeDriver.build({});

    isolationFlags.forEach((flag) => {
      expect(optionsInstance.args).not.toContain(flag);
    });
  });
});
