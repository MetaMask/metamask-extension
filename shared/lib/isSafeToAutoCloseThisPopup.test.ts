import browser from 'webextension-polyfill';
import { isSafeToAutoCloseThisPopup } from './isSafeToAutoCloseThisPopup';

const it = global.it as unknown as jest.It;

// Mock the browser.windows API
jest.mock('webextension-polyfill', () => ({
  windows: {
    getCurrent: jest.fn(),
  },
}));

describe('isSafeToAutoCloseThisPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console warnings and errors during test.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Normal window cases
  it.each([
    // description, windowData, expectedResult
    [
      'should return true when window type is popup',
      { type: 'popup', id: 123 },
      true,
    ],
    [
      'should return false when window type is not popup',
      { type: 'normal', id: 456 },
      false,
    ],
    [
      'should return true when window type is undefined',
      { id: 789 }, // type is deliberately omitted
      true,
    ],
    ['should return true when window is null', null, true],
  ])(
    '%s',
    async (_description: string, windowData: any, expectedResult: boolean) => {
      // Setup mock implementation
      (browser.windows.getCurrent as jest.Mock).mockResolvedValue(windowData);

      const result = await isSafeToAutoCloseThisPopup();

      expect(result).toBe(expectedResult);
      expect(browser.windows.getCurrent).toHaveBeenCalledTimes(1);
    },
  );

  // Error case
  it('should return true when browser API throws', async () => {
    const testError = new Error('Browser API error');
    (browser.windows.getCurrent as jest.Mock).mockRejectedValue(testError);

    const result = await isSafeToAutoCloseThisPopup();

    expect(result).toBe(true);
    expect(browser.windows.getCurrent).toHaveBeenCalledTimes(1);
  });
});
