import type { SessionStorage } from './critical-error-test-session';
import {
  getTestValueFromSession,
  saveTestValueToSession,
  SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
} from './critical-error-test-session';

type MockSessionStorage = SessionStorage & {
  session: {
    set: jest.Mock;
    get: jest.Mock;
    remove: jest.Mock;
  };
};

function createMockStorage(): MockSessionStorage {
  return {
    session: {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn(),
    },
  } as unknown as MockSessionStorage;
}

describe('saveTestValueToSession', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    jest.clearAllMocks();
  });

  it('does not call session.set when inTest is false', async () => {
    await saveTestValueToSession(
      false,
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
      true,
      mockStorage,
    );
    expect(mockStorage.session.set).not.toHaveBeenCalled();
  });

  it('writes the key and value to session storage when inTest is true', async () => {
    mockStorage.session.set.mockResolvedValue(undefined);
    await saveTestValueToSession(
      true,
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
      true,
      mockStorage,
    );
    expect(mockStorage.session.set).toHaveBeenCalledTimes(1);
    expect(mockStorage.session.set).toHaveBeenCalledWith({
      [SESSION_KEY_TEST_RESTORE_FLOW_PENDING]: true,
    });
  });

  it('does not throw when session.set rejects', async () => {
    mockStorage.session.set.mockRejectedValue(new Error('Storage unavailable'));
    await expect(
      saveTestValueToSession(true, 'some-key', 'value', mockStorage as never),
    ).resolves.toBeUndefined();
  });
});

describe('getTestValueFromSession', () => {
  let mockStorage: MockSessionStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    jest.clearAllMocks();
  });

  it('returns undefined and does not call storage when inTest is false', async () => {
    const result = await getTestValueFromSession(
      false,
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
      mockStorage,
    );
    expect(result).toBeUndefined();
    expect(mockStorage.session.get).not.toHaveBeenCalled();
  });

  it('returns undefined when key is not present', async () => {
    mockStorage.session.get.mockResolvedValue({});
    const result = await getTestValueFromSession(
      true,
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
      mockStorage,
    );
    expect(result).toBeUndefined();
    expect(mockStorage.session.get).toHaveBeenCalledWith(
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
    );
    expect(mockStorage.session.remove).not.toHaveBeenCalled();
  });

  it('returns value and removes the key when key is present', async () => {
    mockStorage.session.get.mockResolvedValue({
      [SESSION_KEY_TEST_RESTORE_FLOW_PENDING]: true,
    });
    mockStorage.session.remove.mockResolvedValue(undefined);
    const result = await getTestValueFromSession(
      true,
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
      mockStorage,
    );
    expect(result).toBe(true);
    expect(mockStorage.session.remove).toHaveBeenCalledWith(
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
    );
  });

  it('returns undefined when session.get rejects', async () => {
    mockStorage.session.get.mockRejectedValue(new Error('Storage unavailable'));
    const result = await getTestValueFromSession(
      true,
      SESSION_KEY_TEST_RESTORE_FLOW_PENDING,
      mockStorage,
    );
    expect(result).toBeUndefined();
  });
});
