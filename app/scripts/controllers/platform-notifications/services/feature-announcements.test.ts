import { getFeatureAnnouncementNotifications } from './feature-announcements';

jest.mock('@contentful/rich-text-html-renderer', () => ({
  documentToHtmlString: jest
    .fn()
    .mockImplementation((richText) => `<p>${richText}</p>`),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  } as Response),
);

describe('Feature Announcement Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array if fetch fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Fetch failed');
    });
    const notifications = await getFeatureAnnouncementNotifications();
    expect(notifications).toEqual([]);
  });

  it('should return an empty array if data is not available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(null),
    });
    const notifications = await getFeatureAnnouncementNotifications();
    expect(notifications).toEqual([]);
  });

  it('should fetch entries from Contentful and return formatted notifications', async () => {
    const mockData = {
      items: [
        {
          sys: { createdAt: '2021-01-01T00:00:00Z', id: '1' },
          fields: {
            id: '1',
            title: 'New Feature',
            image: { sys: { id: '2' } },
            link: { sys: { id: '3' } },
            action: { sys: { id: '4' } },
            longDescription: 'This is a long description.',
          },
        },
      ],
      includes: {
        Entry: [
          {
            sys: { id: '3' },
            fields: {
              linkText: 'Learn More',
              linkUrl: 'http://example.com',
              isExternal: true,
            },
          },
          {
            sys: { id: '4' },
            fields: {
              actionText: 'Try Now',
              actionUrl: 'http://example.com/action',
              isExternal: false,
            },
          },
        ],
        Asset: [
          {
            sys: {
              id: '2',
              type: 'Asset',
              createdAt: '2024-01-21T12:00:00.000Z',
              updatedAt: '2024-01-21T12:00:00.000Z',
            },
            fields: {
              title: 'Product Image',
              description: 'This is a product image.',
              file: {
                url: 'http://example.com/image.png',
                details: {
                  size: 2048,
                  image: {
                    width: 1024,
                    height: 768,
                  },
                },
                fileName: 'image.png',
                contentType: 'image/png',
              },
            },
          },
        ],
      },
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    });

    const notifications = await getFeatureAnnouncementNotifications(['1']);
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      id: '1',
      isRead: true,
      type: 'features_announcement',
      createdAt: '2021-01-01T00:00:00.000Z',
      data: {
        id: '1',
        title: 'New Feature',
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
    });
  });
});
