import {
  selectIsMetamaskNotificationsEnabled,
  getMetamaskNotifications,
  getMetamaskNotificationsReadList,
  selectIsSnapNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
} from './metamask-notifications';

describe('Metamask Notifications Selectors', () => {
  const mockState = {
    metamask: {
      isMetamaskNotificationsFeatureSeen: true,
      isMetamaskNotificationsEnabled: true,
      isFeatureAnnouncementsEnabled: true,
      isSnapNotificationsEnabled: true,
      metamaskNotificationsList: [],
      metamaskNotificationsReadList: [],
    },
  };

  it('should select the isMetamaskNotificationsEnabled state', () => {
    expect(selectIsMetamaskNotificationsEnabled(mockState)).toBe(true);
  });

  it('should select the metamaskNotificationsList from state', () => {
    expect(getMetamaskNotifications(mockState)).toEqual([]);
  });

  it('should select the metamaskNotificationsReadList from state', () => {
    expect(getMetamaskNotificationsReadList(mockState)).toEqual([]);
  });

  it('should select the isSnapNotificationsEnabled state', () => {
    expect(selectIsSnapNotificationsEnabled(mockState)).toBe(true);
  });

  it('should select the isFeatureAnnouncementsEnabled state', () => {
    expect(selectIsFeatureAnnouncementsEnabled(mockState)).toBe(true);
  });
});
