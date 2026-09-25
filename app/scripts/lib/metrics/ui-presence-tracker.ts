export type UiPresenceTrackerDeps = {
  getOpenMetamaskTabsIDs: () => Record<number, boolean>;
  getOpenPopupCount: () => number;
  getOpenSidePanelCount: () => number;
  getNotificationIsOpen: () => boolean;
};

export type UiPresenceTracker = {
  isAnyUiOpen: () => boolean;
  isClientOpen: () => boolean;
};

export function createUiPresenceTracker(
  deps: UiPresenceTrackerDeps,
): UiPresenceTracker {
  const isAnyUiOpen = () => {
    const openMetamaskTabsIDs = deps.getOpenMetamaskTabsIDs();
    const isFullscreenOpen = Object.values(openMetamaskTabsIDs).some(Boolean);
    return (
      isFullscreenOpen ||
      deps.getNotificationIsOpen() ||
      deps.getOpenPopupCount() > 0 ||
      deps.getOpenSidePanelCount() > 0
    );
  };

  const isClientOpen = () => {
    const openMetamaskTabsIDs = deps.getOpenMetamaskTabsIDs();
    return (
      deps.getOpenPopupCount() > 0 ||
      Boolean(Object.keys(openMetamaskTabsIDs).length) ||
      deps.getNotificationIsOpen() ||
      deps.getOpenSidePanelCount() > 0 ||
      false
    );
  };

  return { isAnyUiOpen, isClientOpen };
}
