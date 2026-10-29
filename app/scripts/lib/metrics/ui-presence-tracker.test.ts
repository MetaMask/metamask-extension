import { createUiPresenceTracker } from './ui-presence-tracker';

describe('createUiPresenceTracker', () => {
  it('isAnyUiOpen returns true when popup is open', () => {
    const tracker = createUiPresenceTracker({
      getOpenMetamaskTabsIDs: () => ({}),
      getOpenPopupCount: () => 1,
      getOpenSidePanelCount: () => 0,
      getNotificationIsOpen: () => false,
    });

    expect(tracker.isAnyUiOpen()).toBe(true);
    expect(tracker.isClientOpen()).toBe(true);
  });

  it('isAnyUiOpen uses fullscreen tab values, isClientOpen uses tab keys', () => {
    const tracker = createUiPresenceTracker({
      getOpenMetamaskTabsIDs: () => ({ 1: false }),
      getOpenPopupCount: () => 0,
      getOpenSidePanelCount: () => 0,
      getNotificationIsOpen: () => false,
    });

    expect(tracker.isAnyUiOpen()).toBe(false);
    expect(tracker.isClientOpen()).toBe(true);
  });

  describe('getOpenUiCounts', () => {
    it('maps existing presence counters into per-type counts', () => {
      const tracker = createUiPresenceTracker({
        getOpenMetamaskTabsIDs: () => ({ 1: true, 2: true, 3: false }),
        getOpenPopupCount: () => 2,
        getOpenSidePanelCount: () => 1,
        getNotificationIsOpen: () => true,
      });

      expect(tracker.getOpenUiCounts()).toStrictEqual({
        popupCount: 2,
        notificationIsOpen: true,
        fullscreenCount: 2,
        sidePanelCount: 1,
      });
    });

    it('reports zeros when no UI is open', () => {
      const tracker = createUiPresenceTracker({
        getOpenMetamaskTabsIDs: () => ({}),
        getOpenPopupCount: () => 0,
        getOpenSidePanelCount: () => 0,
        getNotificationIsOpen: () => false,
      });

      expect(tracker.getOpenUiCounts()).toStrictEqual({
        popupCount: 0,
        notificationIsOpen: false,
        fullscreenCount: 0,
        sidePanelCount: 0,
      });
    });
  });
});
