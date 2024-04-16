import { TRIGGER_TYPES } from '../constants/notification-schema';
import {
  createMockFeatureAnnouncementAPIResult,
  mockFetchFeatureAnnouncementNotifications,
} from '../mocks/mock-feature-announcements';
import { FeatureAnnouncementsService } from './feature-announcements';

jest.mock('@contentful/rich-text-html-renderer', () => ({
  documentToHtmlString: jest
    .fn()
    .mockImplementation((richText) => `<p>${richText}</p>`),
}));

describe('Feature Announcement Notifications', () => {
  let service: FeatureAnnouncementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeatureAnnouncementsService();
  });

  it('should return an empty array if fetch fails', async () => {
    const mockEndpoint = mockFetchFeatureAnnouncementNotifications({
      status: 500,
    });

    const notifications = await service.getFeatureAnnouncementNotifications();
    mockEndpoint.done();
    expect(notifications).toEqual([]);
  });

  it('should return an empty array if data is not available', async () => {
    const mockEndpoint = mockFetchFeatureAnnouncementNotifications({
      status: 200,
      body: { items: [] },
    });

    const notifications = await service.getFeatureAnnouncementNotifications();
    mockEndpoint.done();
    expect(notifications).toEqual([]);
  });

  it('should fetch entries from Contentful and return formatted notifications', async () => {
    const mockEndpoint = mockFetchFeatureAnnouncementNotifications({
      status: 200,
      body: createMockFeatureAnnouncementAPIResult(),
    });

    const notifications = await service.getFeatureAnnouncementNotifications();
    expect(notifications).toHaveLength(1);
    mockEndpoint.done();

    const resultNotification = notifications[0];
    expect(resultNotification).toEqual(
      expect.objectContaining({
        id: 'dont-miss-out-on-airdrops-and-new-nft-mints',
        type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        createdAt: expect.any(String),
        isRead: expect.any(Boolean),
      }),
    );

    expect(resultNotification.data).toBeDefined();
  });
});
