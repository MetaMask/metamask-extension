import AppStateController from './app-state';

describe('AppStateController', () => {
  const createAppStateController = (initState = {}) => {
    return new AppStateController({
      addUnlockListener: jest.fn(),
      isUnlocked: jest.fn(() => true),
      initState,
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
      messenger: {
        call: jest.fn(),
        controllerName: 'AppStateController',
      },
    });
  };

  describe('setOutdatedBrowserWarningLastShown', () => {
    it('should set the last shown time', () => {
      const appStateController = createAppStateController();
      const date = new Date();

      appStateController.setOutdatedBrowserWarningLastShown(date);

      expect(
        appStateController.store.getState().outdatedBrowserWarningLastShown,
      ).toStrictEqual(date);
    });
  });

  describe('waitForUnlock', () => {
    it('resolves immediately if already unlocked', async () => {
      const appStateController = createAppStateController();
      const emitSpy = jest.spyOn(appStateController, 'emit');
      const resolveFn = jest.fn();
      appStateController.waitForUnlock(resolveFn, false);
      expect(emitSpy).toHaveBeenCalledWith('updateBadge');
      expect(appStateController._messenger.call).toHaveBeenCalledTimes(0);
    });

    it('creates approval request when waitForUnlock is called with shouldShowUnlockRequest as true', async () => {
      const appStateController = createAppStateController();
      jest.spyOn(appStateController, 'isUnlocked').mockReturnValue(false);

      const resolveFn = jest.fn();
      appStateController.waitForUnlock(resolveFn, true);

      expect(appStateController._messenger.call).toHaveBeenCalledTimes(1);
      expect(appStateController._messenger.call).toHaveBeenCalledWith(
        'ApprovalController:addRequest',
        expect.objectContaining({
          id: expect.any(String),
          origin: 'AppStateController',
          type: 'unlock',
        }),
        true,
      );
    });
  });

  describe('handleUnlock', () => {
    let appStateController;
    beforeEach(() => {
      appStateController = createAppStateController();
      jest.spyOn(appStateController, 'isUnlocked').mockReturnValue(false);
      const resolveFn = jest.fn();
      appStateController.waitForUnlock(resolveFn, true);
    });
    it('accepts approval request revolving all the related promises', async () => {
      const emitSpy = jest.spyOn(appStateController, 'emit');

      appStateController.handleUnlock();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith('updateBadge');
      expect(appStateController._messenger.call).toHaveBeenCalled();
      expect(appStateController._messenger.call).toHaveBeenCalledWith(
        'ApprovalController:acceptRequest',
        expect.any(String),
      );
    });
  });
});
