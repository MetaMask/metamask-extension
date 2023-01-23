import AppStateController from './app-state';

describe('AppStateController', function () {
  describe('setOutdatedBrowserWarningLastShown', function () {
    it('should set the last shown time', function () {
      const appStateController = new AppStateController({
        addUnlockListener: jest.fn(),
        isUnlocked: jest.fn(() => true),
        initState: {},
        onInactiveTimeout: jest.fn(),
        showUnlockRequest: jest.fn(),
        preferencesStore: {
          subscribe: jest.fn(),
          getState: jest.fn(() => ({
            preferences: {
              autoLockTimeLimit: 0,
            },
          })),
        },
        qrHardwareStore: {
          subscribe: jest.fn(),
        },
      });
      const date = new Date();

      appStateController.setOutdatedBrowserWarningLastShown(date);

      expect(
        appStateController.store.getState().outdatedBrowserWarningLastShown,
      ).toStrictEqual(date);
    });
  });
});
