export type UiPresenceTrackerDeps = {
  getOpenMetamaskTabsIDs: () => Record<number, boolean>;
  getOpenPopupCount: () => number;
  getOpenSidePanelCount: () => number;
  getNotificationIsOpen: () => boolean;
};

export type OpenUiCounts = {
  popupCount: number;
  notificationIsOpen: boolean;
  fullscreenCount: number;
  sidePanelCount: number;
};

export type UiPresenceTracker = {
  isAnyUiOpen: () => boolean;
  isClientOpen: () => boolean;
  getOpenUiCounts: () => OpenUiCounts;
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

  const getOpenUiCounts = (): OpenUiCounts => {
    const openMetamaskTabsIDs = deps.getOpenMetamaskTabsIDs();
    return {
      popupCount: deps.getOpenPopupCount(),
      notificationIsOpen: deps.getNotificationIsOpen(),
      fullscreenCount:
        Object.values(openMetamaskTabsIDs).filter(Boolean).length,
      sidePanelCount: deps.getOpenSidePanelCount(),
    };
  };

  return { isAnyUiOpen, isClientOpen, getOpenUiCounts };
}
