import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { PlatformNotificationsController } from './platform-notifications';
import { FeatureAnnouncementsService } from './services/feature-announcements';
import { TRIGGER_TYPES } from './constants/triggers';
import type { Notification } from './types/notification';

jest.mock('./services/feature-announcements', () => ({
  FeatureAnnouncementsService: jest.fn().mockImplementation(() => ({
    getFeatureAnnouncementNotifications: jest.fn(),
  })),
}));

describe('PlatformNotificationsController', () => {
  let controller: PlatformNotificationsController;
  let mockGetFeatureAnnouncementNotifications: jest.Mock;

  beforeEach(() => {
    const messenger = {
      registerActionHandler: jest.fn(),
      registerInitialEventPayload: jest.fn(),
      publish: jest.fn(),
    } as unknown as RestrictedControllerMessenger<
      'PlatformNotificationsController',
      any,
      any,
      any,
      any
    >;

    mockGetFeatureAnnouncementNotifications = jest.fn();
    (FeatureAnnouncementsService as jest.Mock).mockImplementation(() => ({
      getFeatureAnnouncementNotifications:
        mockGetFeatureAnnouncementNotifications,
    }));

    controller = new PlatformNotificationsController({
      messenger,
    });
  });

  it('should initialize with the correct default state', () => {
    expect(controller.state).toEqual({
      platformNotificationsList: [],
      platformNotificationsReadList: [],
      platformNotificationsIsLoading: false,
    });
  });

  it('should fetch and update platform notifications', async () => {
    const notifications: Notification[] = [
      {
        type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        createdAt: '2021-01-01T00:00:00.000Z',
        data: {
          id: '1',
          title: 'New Feature',
          category: 'Category',
          shortDescription: 'Short description',
          image: {
            title: 'Product Image',
            description: 'This is a product image.',
            url: 'http://example.com/image.png',
          },
          link: {
            linkText: 'Learn More',
            linkUrl: 'http://example.com',
            isExternal: true,
          },
          action: {
            actionText: 'Try Now',
            actionUrl: 'http://example.com/action',
            isExternal: false,
          },
          longDescription: '<p>This is a long description.</p>',
        },
        id: '1',
        isRead: true,
      },
    ];
    mockGetFeatureAnnouncementNotifications.mockResolvedValue(notifications);

    await controller.fetchAndUpdatePlatformNotifications();

    expect(mockGetFeatureAnnouncementNotifications).toHaveBeenCalled();
    expect(controller.state.platformNotificationsList).toEqual(notifications);
    expect(controller.state.platformNotificationsIsLoading).toBe(false);
  });

  it('should update platform notifications read list', () => {
    const readList = ['1', '2'];
    controller.markPlatformNotificationsAsRead(readList);
    expect(controller.state.platformNotificationsReadList).toEqual(readList);
  });
});
