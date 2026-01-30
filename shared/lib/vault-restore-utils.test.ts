import type browser from 'webextension-polyfill';
import { confirmAndTriggerVaultRestore } from './vault-restore-utils';

// Mock the translate module
jest.mock('./translate', () => ({
  t: jest.fn((key: string) => key),
}));

describe('vault-restore-utils', () => {
  describe('confirmAndTriggerVaultRestore', () => {
    let mockPort: browser.Runtime.Port;

    beforeEach(() => {
      mockPort = {
        postMessage: jest.fn(),
        onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
        onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() },
        name: 'test-port',
      } as unknown as browser.Runtime.Port;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('posts METHOD_REPAIR_DATABASE message when user confirms', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      const result = confirmAndTriggerVaultRestore(mockPort);

      expect(result).toBe(true);
      expect(window.confirm).toHaveBeenCalledWith('stateCorruptionAreYouSure');
      expect(mockPort.postMessage).toHaveBeenCalledWith({
        data: {
          method: 'repairDatabase',
        },
      });
    });

    it('does not post message when user cancels', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      const result = confirmAndTriggerVaultRestore(mockPort);

      expect(result).toBe(false);
      expect(window.confirm).toHaveBeenCalledWith('stateCorruptionAreYouSure');
      expect(mockPort.postMessage).not.toHaveBeenCalled();
    });
  });
});
