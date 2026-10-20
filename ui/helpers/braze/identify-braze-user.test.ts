import {
  changeUser,
  destroy,
  getUser,
  isInitialized,
  type User,
  wipeData,
} from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import { initializeBraze } from './initialize-braze';
import { clearBrazeUser, identifyBrazeUser } from './identify-braze-user';

jest.mock('./initialize-braze');
jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const getUserId = jest.fn() as jest.MockedFunction<User['getUserId']>;
const user: Pick<User, 'getUserId'> = { getUserId };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(initializeBraze).mockReturnValue(true);
  jest.mocked(isInitialized).mockReturnValue(true);
  jest.mocked(getUser).mockReturnValue(user as User);
  getUserId.mockReset().mockReturnValue(undefined);
  jest
    .mocked(changeUser)
    .mockReset()
    .mockImplementation((id) => {
      getUserId.mockReturnValue(id);
    });
  jest.mocked(wipeData).mockReset();
  jest.mocked(destroy).mockReset();
});

describe('identifyBrazeUser', () => {
  it('identifies with the canonical profile ID', () => {
    expect(identifyBrazeUser('canonical-123')).toBe(true);
    expect(changeUser).toHaveBeenCalledWith('canonical-123');
  });

  it('does not repeat changeUser for the current SDK identity', () => {
    getUserId.mockReturnValue('canonical-123');

    expect(identifyBrazeUser('canonical-123')).toBe(true);
    expect(changeUser).not.toHaveBeenCalled();
  });

  it('re-identifies when the canonical profile ID changes', () => {
    identifyBrazeUser('canonical-123');

    expect(identifyBrazeUser('canonical-456')).toBe(true);
    expect(changeUser).toHaveBeenLastCalledWith('canonical-456');
  });

  it('does not initialize for an empty profile ID', () => {
    expect(identifyBrazeUser('')).toBe(false);
    expect(initializeBraze).not.toHaveBeenCalled();
  });

  it('does not identify when initialization is unavailable', () => {
    jest.mocked(initializeBraze).mockReturnValue(false);

    expect(identifyBrazeUser('canonical-123')).toBe(false);
    expect(changeUser).not.toHaveBeenCalled();
  });

  it('reports identity errors', () => {
    const error = new Error('changeUser failed');
    jest.mocked(changeUser).mockImplementationOnce(() => {
      throw error;
    });

    expect(identifyBrazeUser('canonical-123')).toBe(false);
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it('returns false when the SDK rejects the ID without throwing', () => {
    jest.mocked(changeUser).mockImplementationOnce(() => undefined);

    expect(identifyBrazeUser('canonical-123')).toBe(false);
  });
});

describe('clearBrazeUser', () => {
  it('does not activate an unused SDK to clear it', () => {
    jest.mocked(isInitialized).mockReturnValue(false);

    clearBrazeUser();

    expect(initializeBraze).not.toHaveBeenCalled();
    expect(wipeData).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it('wipes local data before destroying the SDK', () => {
    clearBrazeUser();

    expect(wipeData).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(jest.mocked(wipeData).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(destroy).mock.invocationCallOrder[0],
    );
  });

  it('still destroys the SDK if wiping data throws', () => {
    const error = new Error('wipe failed');
    jest.mocked(wipeData).mockImplementationOnce(() => {
      throw error;
    });

    clearBrazeUser();

    expect(captureException).toHaveBeenCalledWith(error);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('reports teardown errors', () => {
    const error = new Error('destroy failed');
    jest.mocked(destroy).mockImplementationOnce(() => {
      throw error;
    });

    clearBrazeUser();

    expect(captureException).toHaveBeenCalledWith(error);
  });
});
