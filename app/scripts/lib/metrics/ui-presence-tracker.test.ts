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
});
