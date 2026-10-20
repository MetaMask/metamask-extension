import { it } from '@jest/globals';
import { initialize, isInitialized } from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import { initializeBraze } from './initialize-braze';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

describe('initializeBraze', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
    };
    delete process.env.IN_TEST;
    delete process.env.METAMASK_DEBUG;
    jest.clearAllMocks();
    jest.mocked(initialize).mockReset().mockReturnValue(true);
    jest.mocked(isInitialized).mockReturnValue(false);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not initialize in a test build', () => {
    process.env.IN_TEST = 'true';

    expect(initializeBraze()).toBe(false);
    expect(initialize).not.toHaveBeenCalled();
  });

  it.each(['BRAZE_WEB_API_KEY', 'BRAZE_SDK_ENDPOINT'])(
    'does not initialize without %s',
    (key) => {
      delete process.env[key];

      expect(initializeBraze()).toBe(false);
      expect(initialize).not.toHaveBeenCalled();
    },
  );

  it('initializes with extension-safe options', () => {
    process.env.METAMASK_VERSION = '13.55.0';
    process.env.METAMASK_DEBUG = 'true';

    expect(initializeBraze()).toBe(true);
    expect(initialize).toHaveBeenCalledWith('test-key', {
      baseUrl: 'sdk.example.com',
      enableLogging: true,
      noCookies: true,
      doNotLoadFontAwesome: true,
      allowUserSuppliedJavascript: false,
      manageServiceWorkerExternally: true,
      disablePushTokenMaintenance: true,
      appVersion: '13.55.0',
    });
  });

  it('does not enable SDK logging outside debug builds', () => {
    initializeBraze();

    expect(initialize).toHaveBeenCalledWith(
      'test-key',
      expect.objectContaining({ enableLogging: false }),
    );
  });

  it('reuses the initialized SDK', () => {
    jest.mocked(isInitialized).mockReturnValue(true);

    expect(initializeBraze()).toBe(true);
    expect(initialize).not.toHaveBeenCalled();
  });

  it('reports initialization errors without preventing a later attempt', () => {
    const error = new Error('init failed');
    jest.mocked(initialize).mockImplementationOnce(() => {
      throw error;
    });

    expect(initializeBraze()).toBe(false);
    expect(captureException).toHaveBeenCalledWith(error);
    expect(initializeBraze()).toBe(true);
  });

  it('allows a later attempt when the SDK reports failure', () => {
    jest.mocked(initialize).mockReturnValueOnce(false);

    expect(initializeBraze()).toBe(false);
    expect(captureException).not.toHaveBeenCalled();
    expect(initializeBraze()).toBe(true);
  });
});
