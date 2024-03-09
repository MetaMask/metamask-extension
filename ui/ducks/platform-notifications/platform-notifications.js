// Selectors
export const getPlatformNotificationsList = (state) =>
  state.metamask.platformNotificationsList;
export const getPlatformNotificationsReadList = (state) =>
  state.metamask.platformNotificationsReadList;
export const getPlatformNotificationsIsLoading = (state) =>
  state.metamask.platformNotificationsIsLoading;

// TODO Remove these selectors
export const getAuthenticationStatus = (state) =>
  state.metamask.isAuthenticated;
