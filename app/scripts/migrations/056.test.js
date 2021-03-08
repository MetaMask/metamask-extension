import { strict as assert } from 'assert';
import { UI_NOTIFICATIONS } from '../../../shared/notifications';
import migration56 from './056';

describe('migration #56', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 55,
      },
      data: {},
    };

    const newStorage = await migration56.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 56,
    });
  });

  describe('setting swaps notification to shown', function () {
    it(`should set the swaps notification to shown if swapsWelcomeMessageHasBeenShown is true and the notification state has not been initialized`, async function () {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: true,
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration56.migrate(oldStorage);
      assert.strictEqual(
        newStorage.data.NotificationController.notifications[1].isShown,
        true,
      );
    });

    it(`should set the swaps notification to shown if swapsWelcomeMessageHasBeenShown is true and the notification state has been initialized`, async function () {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: true,
          },
          NotificationController: {
            notifications: {
              1: {
                isShown: false,
              },
              2: {
                isShown: false,
              },
            },
            bar: 'baz',
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration56.migrate(oldStorage);
      assert.deepEqual(newStorage.data.NotificationController, {
        ...oldStorage.data.NotificationController,
        notifications: {
          ...oldStorage.data.NotificationController.notifications,
          1: {
            ...UI_NOTIFICATIONS[1],
            isShown: true,
          },
        },
      });
    });

    it(`should not set the swaps notification to shown if swapsWelcomeMessageHasBeenShown is false`, async function () {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: false,
          },
          NotificationController: {
            1: {
              fizz: 'buzz',
              isShown: false,
            },
            2: {
              fizz: 'buzz',
              isShown: false,
            },
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration56.migrate(oldStorage);
      assert.deepEqual(
        newStorage.data.NotificationController,
        oldStorage.data.NotificationController,
      );
    });
  });

  describe('deleting swapsWelcomeMessageHasBeenShown', function () {
    it('should delete the swapsWelcomeMessageHasBeenShown property', async function () {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: false,
            bar: 'baz',
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration56.migrate(oldStorage);
      assert.deepEqual(newStorage.data.AppStateController, { bar: 'baz' });
    });
  });
});
