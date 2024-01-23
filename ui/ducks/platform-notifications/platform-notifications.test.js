import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as platformNotificationsActions from './platform-notifications';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

describe('Platform Notifications Duck', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      platformNotifications: {
        notificationsList: [],
        notificationsReadList: [],
        notificationsIsLoading: false,
      },
    });
  });

  describe('Selectors', () => {
    it('getPlatformNotificationsList should return the list of notifications', () => {
      const notificationsList =
        platformNotificationsActions.getPlatformNotificationsList(
          store.getState(),
        );
      expect(notificationsList).toStrictEqual([]);
    });

    it('getPlatformNotificationsReadList should return the list of read notifications', () => {
      const notificationsReadList =
        platformNotificationsActions.getPlatformNotificationsReadList(
          store.getState(),
        );
      expect(notificationsReadList).toStrictEqual([]);
    });

    it('getPlatformNotificationsIsLoading should return the loading state', () => {
      const isLoading =
        platformNotificationsActions.getPlatformNotificationsIsLoading(
          store.getState(),
        );
      expect(isLoading).toStrictEqual(false);
    });
  });
});
