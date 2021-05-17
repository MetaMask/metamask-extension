import { strict as assert } from 'assert';
import migration60 from './060';

describe('migration #60', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 59,
      },
      data: {},
    };

    migration60
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 60,
        });
        done();
      })
      .catch(done);
  });

  it('prunes the support notification', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        NotificationController: {
          notifications: {
            1: {
              id: 1,
              date: '2021-03-17',
              image: {
                src: 'images/mobile-link-qr.svg',
                height: '230px',
                width: '230px',
                placeImageBelowDescription: true,
              },
            },
            2: {
              id: 2,
              date: '2020-08-31',
            },
            3: {
              id: 3,
              date: '2021-03-08',
            },
            4: {
              id: 4,
              date: '2021-05-11',
              image: {
                src: 'images/source-logos-bsc.svg',
                width: '100%',
              },
            },
          },
        },
      },
    };

    migration60
      .migrate(oldStorage)
      .then((newStorage) => {
        const { notifications } = newStorage.data.NotificationController;
        const notificationKeys = Object.keys(notifications);
        // Assert support notification is removed
        assert.equal(notificationKeys.length, 3);
        notificationKeys.forEach((key) => {
          assert.notEqual(notifications[key].date, '2020-08-31');
        });
        done();
      })
      .catch(done);
  });
});
