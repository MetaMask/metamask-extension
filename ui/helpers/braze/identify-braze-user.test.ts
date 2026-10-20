import {
  changeUser as mockBrazeChangeUser,
  initialize as mockBrazeInitialize,
  wipeData as mockBrazeWipeData,
} from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import { resetBrazeInitializationForTesting } from './initialize-braze';
import {
  clearBrazeUser,
  getIdentifiedBrazeProfileId,
  identifyBrazeUser,
  resetBrazeIdentityForTesting,
} from './identify-braze-user';

jest.mock('@braze/web-sdk', () => ({
  initialize: jest.fn().mockReturnValue(true),
  changeUser: jest.fn(),
  wipeData: jest.fn(),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockInitialize = mockBrazeInitialize as jest.MockedFunction<
  typeof mockBrazeInitialize
>;
const mockChangeUser = mockBrazeChangeUser as jest.MockedFunction<
  typeof mockBrazeChangeUser
>;
const mockWipeData = mockBrazeWipeData as jest.MockedFunction<
  typeof mockBrazeWipeData
>;
const mockCaptureException = captureException as jest.MockedFunction<
  typeof captureException
>;

describe('identifyBrazeUser', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.IN_TEST;
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';
    resetBrazeInitializationForTesting();
    resetBrazeIdentityForTesting();
    jest.clearAllMocks();
    mockInitialize.mockReturnValue(true);
    mockChangeUser.mockReset();
    mockWipeData.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    resetBrazeInitializationForTesting();
    resetBrazeIdentityForTesting();
    jest.mocked(console.warn).mockRestore();
  });

  it('identifies the user with the canonical profile ID', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    expect(mockChangeUser).toHaveBeenCalledTimes(1);
    expect(mockChangeUser).toHaveBeenCalledWith('canonical-123');
    expect(getIdentifiedBrazeProfileId()).toBe('canonical-123');
  });

  it('does not call changeUser twice for the same ID', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    expect(mockChangeUser).toHaveBeenCalledTimes(1);
  });

  it('re-identifies when the canonical profile ID changes', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    await expect(identifyBrazeUser('canonical-456')).resolves.toBe(true);
    expect(mockChangeUser).toHaveBeenCalledTimes(2);
    expect(mockChangeUser).toHaveBeenLastCalledWith('canonical-456');
  });

  it('resolves false for an empty profile ID', async () => {
    await expect(identifyBrazeUser('')).resolves.toBe(false);
    expect(mockChangeUser).not.toHaveBeenCalled();
  });

  it('resolves false in a test build', async () => {
    process.env.IN_TEST = 'true';

    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(false);
    expect(mockChangeUser).not.toHaveBeenCalled();
  });

  it('resolves false when the SDK cannot initialize', async () => {
    delete process.env.BRAZE_WEB_API_KEY;

    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(false);
    expect(mockChangeUser).not.toHaveBeenCalled();
  });

  it('resolves false and captures the error when changeUser throws', async () => {
    const error = new Error('changeUser failed');
    mockChangeUser.mockImplementation(() => {
      throw error;
    });

    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(false);
    expect(mockCaptureException).toHaveBeenCalledWith(error);
    expect(getIdentifiedBrazeProfileId()).toBeUndefined();
  });
});

describe('clearBrazeUser', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.IN_TEST;
    process.env.BRAZE_WEB_API_KEY = 'test-key';
    process.env.BRAZE_SDK_ENDPOINT = 'sdk.iad-07.braze.com';
    resetBrazeInitializationForTesting();
    resetBrazeIdentityForTesting();
    jest.clearAllMocks();
    mockInitialize.mockReturnValue(true);
    mockChangeUser.mockReset();
    mockWipeData.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    resetBrazeInitializationForTesting();
    resetBrazeIdentityForTesting();
    jest.mocked(console.warn).mockRestore();
  });

  it('does not wipe when the SDK was never initialized', async () => {
    await clearBrazeUser();

    expect(mockWipeData).not.toHaveBeenCalled();
  });

  it('wipes local SDK data after identify', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);

    await clearBrazeUser();

    expect(mockWipeData).toHaveBeenCalledTimes(1);
    expect(getIdentifiedBrazeProfileId()).toBeUndefined();
  });

  it('allows identifying again after wipe', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    await clearBrazeUser();
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);

    expect(mockInitialize).toHaveBeenCalledTimes(2);
    expect(mockChangeUser).toHaveBeenCalledTimes(2);
  });

  it('does not wipe in a test build', async () => {
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);
    process.env.IN_TEST = 'true';

    await clearBrazeUser();

    expect(mockWipeData).not.toHaveBeenCalled();
    expect(getIdentifiedBrazeProfileId()).toBeUndefined();
  });

  it('captures the error when wipeData throws and still resets identity', async () => {
    const error = new Error('wipe failed');
    mockWipeData.mockImplementation(() => {
      throw error;
    });
    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);

    await clearBrazeUser();

    expect(mockCaptureException).toHaveBeenCalledWith(error);
    expect(getIdentifiedBrazeProfileId()).toBeUndefined();
  });

  it('runs a wipe requested while identify is in flight after the identify completes', async () => {
    const identifyPromise = identifyBrazeUser('canonical-123');
    await clearBrazeUser();
    await expect(identifyPromise).resolves.toBe(true);

    expect(mockChangeUser).toHaveBeenCalledTimes(1);
    expect(mockWipeData).toHaveBeenCalledTimes(1);
    expect(mockChangeUser.mock.invocationCallOrder[0]).toBeLessThan(
      mockWipeData.mock.invocationCallOrder[0],
    );
    expect(getIdentifiedBrazeProfileId()).toBeUndefined();
  });

  it('re-initializes and re-identifies when identify runs after a queued wipe', async () => {
    const identifyPromise = identifyBrazeUser('canonical-123');
    await clearBrazeUser();
    await expect(identifyPromise).resolves.toBe(true);

    await expect(identifyBrazeUser('canonical-123')).resolves.toBe(true);

    expect(mockInitialize).toHaveBeenCalledTimes(2);
    expect(mockChangeUser).toHaveBeenCalledTimes(2);
    expect(getIdentifiedBrazeProfileId()).toBe('canonical-123');
  });
});
