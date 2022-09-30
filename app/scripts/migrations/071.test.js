import migration71 from './071';

describe('migration #71', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 70,
      },
      data: {},
    };

    const newStorage = await migration71.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 71,
    });
  });

  it('should rename NotificationController', async () => {
    const oldStorage = {
      meta: {
        version: 70,
      },
      data: {
        FooController: { a: 'b' },
        NotificationController: {
          notifications: [
            {
              date: '2021-03-17',
              id: 1,
              image: {
                height: '230px',
                placeImageBelowDescription: true,
                src: 'images/mobile-link-qr.svg',
                width: '230px',
              },
              isShown: false,
            },
            { date: '2021-03-08', id: 3, isShown: false },
            {
              date: '2021-05-11',
              id: 4,
              image: { src: 'images/source-logos-bsc.svg', width: '100%' },
              isShown: false,
            },
            { date: '2021-06-09', id: 5, isShown: false },
            { date: '2021-05-26', id: 6, isShown: false },
            { date: '2021-09-17', id: 7, isShown: false },
            { date: '2021-11-01', id: 8, isShown: false },
            {
              date: '2021-12-07',
              id: 9,
              image: { src: 'images/txinsights.png', width: '80%' },
              isShown: false,
            },
            {
              date: '2022-04-18',
              id: 10,
              image: { src: 'images/token-detection.svg', width: '100%' },
              isShown: false,
            },
            { date: '2022-04-18', id: 11, isShown: false },
            {
              date: '2022-05-18',
              id: 12,
              image: { src: 'images/darkmode-banner.png', width: '100%' },
              isShown: true,
            },
          ],
        },
      },
    };

    const newStorage = await migration71.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 71,
      },
      data: {
        FooController: { a: 'b' },
        AnnouncementController: {
          announcements: oldStorage.data.NotificationController.notifications,
        },
      },
    });
  });

  it('should handle missing NotificationController', async () => {
    const oldStorage = {
      meta: {
        version: 70,
      },
      data: {
        FooController: { a: 'b' },
      },
    };

    const newStorage = await migration71.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 71,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });
});
