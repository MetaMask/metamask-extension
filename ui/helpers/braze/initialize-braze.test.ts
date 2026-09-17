import { initialize as mockBrazeInitialize } from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import {
  initializeBraze,
  resetBrazeInitializationForTesting,
} from './initialize-braze';

jest.mock('@braze/web-sdk', () => ({
  initialize: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockInitialize = mockBrazeInitialize as jest.MockedFunction<
  typeof mockBrazeInitialize
>;
const mockCaptureException = captureException as jest.MockedFunction<
  typeof captureException
>;

describe('initializeBraze', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.IN_TEST;
    delete process.env.BRAZE_WEB_API_KEY;
    delete process.env.BRAZE_SDK_ENDPOINT;
    delete process.env.METAMASK_DEBUG;
    resetBrazeInitializationForTesting();
    mockInitialize.mockReturnValue(true);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetBrazeInitializationForTesting();
  });

  it('returns false when running in a test build', () => {
    process.env.IN_TEST = 'true';
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';

    expect(initializeBraze()).toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('returns false when the API key is missing', () => {
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';

    expect(initializeBraze()).toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('returns false when the SDK endpoint is missing', () => {
    process.env.BRAZE_WEB_API_KEY = 'test-key';

    expect(initializeBraze()).toBe(false);
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('initializes the SDK with extension-safe options', () => {
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';
    process.env.METAMASK_VERSION = '13.49.0';
    process.env.METAMASK_DEBUG = 'true';

    expect(initializeBraze()).toBe(true);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(mockInitialize).toHaveBeenCalledWith('test-key', {
      baseUrl: 'sdk.iad-07.braze.com',
      enableLogging: true,
      noCookies: true,
      doNotLoadFontAwesome: true,
      allowUserSuppliedJavascript: false,
      manageServiceWorkerExternally: true,
      disablePushTokenMaintenance: true,
      appVersion: '13.49.0',
    });
  });

  it('does not initialize twice', () => {
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';

    expect(initializeBraze()).toBe(true);
    expect(initializeBraze()).toBe(true);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });

  it('returns false and captures the error when initialize throws', () => {
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';
    const error = new Error('init failed');
    mockInitialize.mockImplementation(() => {
      throw error;
    });

    expect(initializeBraze()).toBe(false);
    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });

  it('returns false when the SDK reports initialize failure', () => {
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';
    mockInitialize.mockReturnValue(false);

    expect(initializeBraze()).toBe(false);
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});
